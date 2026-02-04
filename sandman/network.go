package main

import (
	"crypto/md5"
	"fmt"
	"os/exec"
	"strings"
)

const (
	TapPrefix   = "tap"
	HostIP      = "172.16.0.1"
	SubnetMask  = "24"
	GatewayIP   = "172.16.0.1"
)

// NetworkManager handles TAP device creation and deletion
type NetworkManager struct{}

// NewNetworkManager creates a new network manager
func NewNetworkManager() *NetworkManager {
	return &NetworkManager{}
}

// CreateTapDevice creates a TAP device for a VM
func (nm *NetworkManager) CreateTapDevice(sandboxID string) (string, error) {
	tapName := nm.getTapName(sandboxID)

	// Check if already exists
	if nm.tapExists(tapName) {
		return tapName, nil
	}

	// Create TAP device
	if err := runCommand("ip", "tuntap", "add", "dev", tapName, "mode", "tap"); err != nil {
		return "", fmt.Errorf("failed to create TAP device %s: %w", tapName, err)
	}

	// Bring it up
	if err := runCommand("ip", "link", "set", "dev", tapName, "up"); err != nil {
		nm.DeleteTapDevice(sandboxID)
		return "", fmt.Errorf("failed to bring up TAP device %s: %w", tapName, err)
	}

	return tapName, nil
}

// DeleteTapDevice removes a TAP device
func (nm *NetworkManager) DeleteTapDevice(sandboxID string) error {
	tapName := nm.getTapName(sandboxID)

	if !nm.tapExists(tapName) {
		return nil
	}

	if err := runCommand("ip", "link", "delete", tapName); err != nil {
		return fmt.Errorf("failed to delete TAP device %s: %w", tapName, err)
	}

	return nil
}

// SetupHostNetwork ensures host network is configured for VM networking
func (nm *NetworkManager) SetupHostNetwork() error {
	// Enable IP forwarding
	if err := runCommand("sysctl", "-w", "net.ipv4.ip_forward=1"); err != nil {
		return fmt.Errorf("failed to enable IP forwarding: %w", err)
	}

	// Get default interface
	hostIface, err := nm.getDefaultInterface()
	if err != nil {
		return fmt.Errorf("failed to get default interface: %w", err)
	}

	// Setup NAT (ignore errors if rules already exist)
	runCommand("iptables", "-t", "nat", "-C", "POSTROUTING", "-o", hostIface, "-j", "MASQUERADE")
	if err := runCommand("iptables", "-t", "nat", "-A", "POSTROUTING", "-o", hostIface, "-j", "MASQUERADE"); err != nil {
		// Rule might already exist, that's okay
	}

	runCommand("iptables", "-C", "FORWARD", "-m", "conntrack", "--ctstate", "RELATED,ESTABLISHED", "-j", "ACCEPT")
	runCommand("iptables", "-A", "FORWARD", "-m", "conntrack", "--ctstate", "RELATED,ESTABLISHED", "-j", "ACCEPT")

	return nil
}

// ConfigureVMNetwork adds routes for a VM's TAP device
func (nm *NetworkManager) ConfigureVMNetwork(sandboxID, ipAddress string) error {
	tapName := nm.getTapName(sandboxID)

	// Add route for VM IP through TAP
	if err := runCommand("ip", "route", "add", ipAddress+"/32", "dev", tapName); err != nil {
		// Ignore if route already exists
		if !strings.Contains(err.Error(), "File exists") {
			return fmt.Errorf("failed to add route for %s: %w", ipAddress, err)
		}
	}

	// Get default interface for forwarding rules
	hostIface, _ := nm.getDefaultInterface()
	if hostIface != "" {
		runCommand("iptables", "-A", "FORWARD", "-i", tapName, "-o", hostIface, "-j", "ACCEPT")
	}

	return nil
}

// CleanupVMNetwork removes network configuration for a VM
func (nm *NetworkManager) CleanupVMNetwork(sandboxID, ipAddress string) error {
	tapName := nm.getTapName(sandboxID)

	// Remove route
	runCommand("ip", "route", "del", ipAddress+"/32", "dev", tapName)

	// Remove iptables rules
	hostIface, _ := nm.getDefaultInterface()
	if hostIface != "" {
		runCommand("iptables", "-D", "FORWARD", "-i", tapName, "-o", hostIface, "-j", "ACCEPT")
	}

	return nil
}

// GenerateMAC generates a unique MAC address based on sandbox ID
func (nm *NetworkManager) GenerateMAC(sandboxID string) string {
	hash := md5.Sum([]byte(sandboxID))
	return fmt.Sprintf("AA:FC:00:%02x:%02x:%02x", hash[0], hash[1], hash[2])
}

// getTapName generates TAP device name from sandbox ID
func (nm *NetworkManager) getTapName(sandboxID string) string {
	// Use hash to ensure valid interface name (max 15 chars)
	hash := md5.Sum([]byte(sandboxID))
	return fmt.Sprintf("tap%x", hash[:4])
}

// tapExists checks if a TAP device exists
func (nm *NetworkManager) tapExists(tapName string) bool {
	err := runCommand("ip", "link", "show", tapName)
	return err == nil
}

// getDefaultInterface gets the default network interface
func (nm *NetworkManager) getDefaultInterface() (string, error) {
	output, err := exec.Command("ip", "route", "show", "default").Output()
	if err != nil {
		return "", err
	}

	fields := strings.Fields(string(output))
	for i, field := range fields {
		if field == "dev" && i+1 < len(fields) {
			return fields[i+1], nil
		}
	}

	return "", fmt.Errorf("no default interface found")
}

// runCommand runs a command and returns an error if it fails
func runCommand(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("%s: %s", err, string(output))
	}
	return nil
}
