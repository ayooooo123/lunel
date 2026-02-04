package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"regexp"
	"syscall"
)

const (
	DefaultPort = 6677
)

func main() {
	// Parse command line flags
	authToken := flag.String("auth", "", "Authentication token (required, 64 alphanumeric chars)")
	port := flag.Int("port", DefaultPort, "API server port")
	baseImage := flag.String("image", "", "Path to base rootfs.ext4 image (required)")
	kernel := flag.String("kernel", "", "Path to vmlinux kernel (required)")
	flag.Parse()

	// Validate auth token
	if *authToken == "" {
		fmt.Fprintln(os.Stderr, "Error: --auth is required")
		flag.Usage()
		os.Exit(1)
	}
	if !regexp.MustCompile(`^[a-zA-Z0-9]{64}$`).MatchString(*authToken) {
		fmt.Fprintln(os.Stderr, "Error: --auth must be exactly 64 alphanumeric characters")
		os.Exit(1)
	}

	// Validate base image
	if *baseImage == "" {
		fmt.Fprintln(os.Stderr, "Error: --image is required")
		flag.Usage()
		os.Exit(1)
	}
	if _, err := os.Stat(*baseImage); err != nil {
		fmt.Fprintf(os.Stderr, "Error: base image not found: %s\n", *baseImage)
		os.Exit(1)
	}
	absBaseImage, _ := filepath.Abs(*baseImage)

	// Validate kernel
	if *kernel == "" {
		fmt.Fprintln(os.Stderr, "Error: --kernel is required")
		flag.Usage()
		os.Exit(1)
	}
	if _, err := os.Stat(*kernel); err != nil {
		fmt.Fprintf(os.Stderr, "Error: kernel not found: %s\n", *kernel)
		os.Exit(1)
	}
	absKernel, _ := filepath.Abs(*kernel)

	// Check if running as root
	if os.Geteuid() != 0 {
		fmt.Fprintln(os.Stderr, "Error: sandman must be run as root")
		os.Exit(1)
	}

	fmt.Println("Starting Sandman...")

	// Initialize resource tracker
	resourceMgr, err := NewResourceTracker()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error initializing resources: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("System resources: %d CPUs, %d MB RAM\n", resourceMgr.TotalCPUs, resourceMgr.TotalRAMMb)
	fmt.Printf("Reserved for host: %d CPUs, %d MB RAM\n", ReservedCPUs, ReservedRAMMb)

	// Initialize state manager
	stateFile := GetStateFilePath()
	stateMgr := NewStateManager(stateFile)

	loaded, err := stateMgr.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error loading state: %v\n", err)
		os.Exit(1)
	}

	if loaded {
		fmt.Printf("Loaded existing state from %s\n", stateFile)
	} else {
		fmt.Println("Starting with fresh state")
	}

	// Initialize network manager
	netMgr := NewNetworkManager()

	// Setup host networking
	if err := netMgr.SetupHostNetwork(); err != nil {
		fmt.Fprintf(os.Stderr, "Warning: failed to setup host network: %v\n", err)
		// Continue anyway, might already be set up
	}

	// Initialize VM manager
	vmMgr := NewVMManager(absBaseImage, absKernel, stateMgr, netMgr, resourceMgr)

	// Ensure Firecracker is installed
	if err := vmMgr.EnsureFirecracker(); err != nil {
		fmt.Fprintf(os.Stderr, "Error ensuring Firecracker: %v\n", err)
		os.Exit(1)
	}

	// Cleanup dead VMs from previous run
	if loaded {
		fmt.Println("Checking for dead VMs...")
		vmMgr.CleanupDeadVMs()
	}

	// Create API server
	apiServer := NewAPIServer(*authToken, vmMgr, stateMgr, resourceMgr)

	// Setup signal handling
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		fmt.Println("\nShutting down Sandman (VMs will continue running)...")
		os.Exit(0)
	}()

	// Start server
	addr := fmt.Sprintf(":%d", *port)
	fmt.Printf("Sandman listening on port %d\n", *port)
	fmt.Println("Endpoints:")
	fmt.Println("  GET    /health     - Health check (no auth)")
	fmt.Println("  GET    /resources  - Resource info")
	fmt.Println("  GET    /vms        - List VMs")
	fmt.Println("  POST   /vms        - Create VM")
	fmt.Println("  GET    /vms/:id    - Get VM")
	fmt.Println("  DELETE /vms/:id    - Delete VM")
	fmt.Println()

	if err := http.ListenAndServe(addr, apiServer); err != nil {
		fmt.Fprintf(os.Stderr, "Error starting server: %v\n", err)
		os.Exit(1)
	}
}
