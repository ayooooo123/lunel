package main

import (
	"bufio"
	"fmt"
	"os"
	"runtime"
	"strconv"
	"strings"
)

const (
	ReservedCPUs  = 2     // Reserved for host OS
	ReservedRAMMb = 10240 // 10GB reserved for host OS
)

// ResourceTracker tracks available system resources
type ResourceTracker struct {
	TotalCPUs  int
	TotalRAMMb int
}

// NewResourceTracker creates a new resource tracker
func NewResourceTracker() (*ResourceTracker, error) {
	totalRAM, err := getTotalRAMMb()
	if err != nil {
		return nil, fmt.Errorf("failed to get total RAM: %w", err)
	}

	return &ResourceTracker{
		TotalCPUs:  runtime.NumCPU(),
		TotalRAMMb: totalRAM,
	}, nil
}

// AvailableCPUs returns CPUs available for VMs (total - reserved - allocated)
func (rt *ResourceTracker) AvailableCPUs(allocatedCPUs int) int {
	available := rt.TotalCPUs - ReservedCPUs - allocatedCPUs
	if available < 0 {
		return 0
	}
	return available
}

// AvailableRAMMb returns RAM available for VMs (total - reserved - allocated)
func (rt *ResourceTracker) AvailableRAMMb(allocatedRAMMb int) int {
	available := rt.TotalRAMMb - ReservedRAMMb - allocatedRAMMb
	if available < 0 {
		return 0
	}
	return available
}

// CanAllocate checks if we can allocate the requested resources
func (rt *ResourceTracker) CanAllocate(requestedCPUs, requestedRAMMb, currentAllocCPUs, currentAllocRAMMb int) error {
	availCPUs := rt.AvailableCPUs(currentAllocCPUs)
	availRAM := rt.AvailableRAMMb(currentAllocRAMMb)

	if requestedCPUs > availCPUs {
		return fmt.Errorf("insufficient CPUs: requested %d, available %d", requestedCPUs, availCPUs)
	}
	if requestedRAMMb > availRAM {
		return fmt.Errorf("insufficient RAM: requested %dMB, available %dMB", requestedRAMMb, availRAM)
	}
	return nil
}

// GetResourcesResponse returns the current resource state
func (rt *ResourceTracker) GetResourcesResponse(allocatedCPUs, allocatedRAMMb, vmCount int) ResourcesResponse {
	return ResourcesResponse{
		TotalCPUs:      rt.TotalCPUs,
		AvailableCPUs:  rt.AvailableCPUs(allocatedCPUs),
		UsedCPUs:       allocatedCPUs,
		ReservedCPUs:   ReservedCPUs,
		TotalRAMGb:     rt.TotalRAMMb / 1024,
		AvailableRAMGb: rt.AvailableRAMMb(allocatedRAMMb) / 1024,
		UsedRAMGb:      allocatedRAMMb / 1024,
		ReservedRAMGb:  ReservedRAMMb / 1024,
		VMCount:        vmCount,
	}
}

// FindFreeCPUs finds N free CPU cores for dedicated allocation
func (rt *ResourceTracker) FindFreeCPUs(n int, allocatedCPUs []int) ([]int, error) {
	allocated := make(map[int]bool)
	for _, cpu := range allocatedCPUs {
		allocated[cpu] = true
	}

	// Skip reserved CPUs (0 and 1)
	freeCPUs := []int{}
	for i := ReservedCPUs; i < rt.TotalCPUs; i++ {
		if !allocated[i] {
			freeCPUs = append(freeCPUs, i)
			if len(freeCPUs) == n {
				break
			}
		}
	}

	if len(freeCPUs) < n {
		return nil, fmt.Errorf("not enough free CPUs for dedicated allocation: need %d, found %d", n, len(freeCPUs))
	}

	return freeCPUs, nil
}

// getTotalRAMMb reads total RAM from /proc/meminfo
func getTotalRAMMb() (int, error) {
	file, err := os.Open("/proc/meminfo")
	if err != nil {
		return 0, err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "MemTotal:") {
			fields := strings.Fields(line)
			if len(fields) >= 2 {
				kb, err := strconv.Atoi(fields[1])
				if err != nil {
					return 0, err
				}
				return kb / 1024, nil // Convert KB to MB
			}
		}
	}

	return 0, fmt.Errorf("MemTotal not found in /proc/meminfo")
}
