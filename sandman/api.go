package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

// APIServer handles HTTP API requests
type APIServer struct {
	authToken   string
	vmManager   *VMManager
	stateMgr    *StateManager
	resourceMgr *ResourceTracker
	mux         *http.ServeMux
}

// NewAPIServer creates a new API server
func NewAPIServer(authToken string, vmManager *VMManager, stateMgr *StateManager, resourceMgr *ResourceTracker) *APIServer {
	s := &APIServer{
		authToken:   authToken,
		vmManager:   vmManager,
		stateMgr:    stateMgr,
		resourceMgr: resourceMgr,
		mux:         http.NewServeMux(),
	}

	s.setupRoutes()
	return s
}

// setupRoutes configures API routes
func (s *APIServer) setupRoutes() {
	s.mux.HandleFunc("/vms", s.authMiddleware(s.handleVMs))
	s.mux.HandleFunc("/vms/", s.authMiddleware(s.handleVM))
	s.mux.HandleFunc("/resources", s.authMiddleware(s.handleResources))
	s.mux.HandleFunc("/health", s.handleHealth) // No auth for health check
}

// ServeHTTP implements http.Handler
func (s *APIServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.mux.ServeHTTP(w, r)
}

// authMiddleware validates bearer token
func (s *APIServer) authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		if auth == "" {
			s.respondError(w, http.StatusUnauthorized, "missing Authorization header")
			return
		}

		if !strings.HasPrefix(auth, "Bearer ") {
			s.respondError(w, http.StatusUnauthorized, "invalid Authorization format, expected: Bearer <token>")
			return
		}

		token := strings.TrimPrefix(auth, "Bearer ")
		if token != s.authToken {
			s.respondError(w, http.StatusUnauthorized, "invalid token")
			return
		}

		next(w, r)
	}
}

// handleVMs handles /vms endpoint
func (s *APIServer) handleVMs(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.listVMs(w, r)
	case http.MethodPost:
		s.createVM(w, r)
	default:
		s.respondError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// handleVM handles /vms/:sandbox_id endpoint
func (s *APIServer) handleVM(w http.ResponseWriter, r *http.Request) {
	// Extract sandbox_id from path
	path := strings.TrimPrefix(r.URL.Path, "/vms/")
	sandboxID := strings.TrimSuffix(path, "/")

	if sandboxID == "" {
		s.respondError(w, http.StatusBadRequest, "sandbox_id is required")
		return
	}

	switch r.Method {
	case http.MethodGet:
		s.getVM(w, r, sandboxID)
	case http.MethodDelete:
		s.deleteVM(w, r, sandboxID)
	default:
		s.respondError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// handleResources handles /resources endpoint
func (s *APIServer) handleResources(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		s.respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	allocCPUs, allocRAM, vmCount := s.stateMgr.GetAllocatedResources()
	resp := s.resourceMgr.GetResourcesResponse(allocCPUs, allocRAM, vmCount)
	s.respondJSON(w, http.StatusOK, resp)
}

// handleHealth handles /health endpoint (no auth)
func (s *APIServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		s.respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	s.respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// listVMs returns all VMs
func (s *APIServer) listVMs(w http.ResponseWriter, r *http.Request) {
	vms := s.vmManager.ListVMs()
	responses := make([]VMResponse, len(vms))
	for i, vm := range vms {
		alive := IsProcessAlive(vm.PID)
		responses[i] = vm.ToResponse(alive)
	}
	s.respondJSON(w, http.StatusOK, responses)
}

// getVM returns a single VM
func (s *APIServer) getVM(w http.ResponseWriter, r *http.Request, sandboxID string) {
	vm, ok := s.vmManager.GetVM(sandboxID)
	if !ok {
		s.respondError(w, http.StatusNotFound, fmt.Sprintf("VM %s not found", sandboxID))
		return
	}

	alive := IsProcessAlive(vm.PID)
	s.respondJSON(w, http.StatusOK, vm.ToResponse(alive))
}

// createVM creates a new VM
func (s *APIServer) createVM(w http.ResponseWriter, r *http.Request) {
	var req CreateVMRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.respondError(w, http.StatusBadRequest, fmt.Sprintf("invalid JSON: %v", err))
		return
	}

	if err := req.Validate(); err != nil {
		s.respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	vm, err := s.vmManager.CreateVM(&req)
	if err != nil {
		// Determine appropriate status code
		statusCode := http.StatusInternalServerError
		errStr := err.Error()
		if strings.Contains(errStr, "already exists") {
			statusCode = http.StatusConflict
		} else if strings.Contains(errStr, "insufficient") {
			statusCode = http.StatusServiceUnavailable
		}
		s.respondError(w, statusCode, err.Error())
		return
	}

	s.respondJSON(w, http.StatusCreated, vm.ToResponse(true))
}

// deleteVM deletes a VM
func (s *APIServer) deleteVM(w http.ResponseWriter, r *http.Request, sandboxID string) {
	if err := s.vmManager.DeleteVM(sandboxID); err != nil {
		statusCode := http.StatusInternalServerError
		if strings.Contains(err.Error(), "not found") {
			statusCode = http.StatusNotFound
		}
		s.respondError(w, statusCode, err.Error())
		return
	}

	s.respondJSON(w, http.StatusOK, map[string]string{
		"message":    "VM deleted successfully",
		"sandbox_id": sandboxID,
	})
}

// respondJSON sends a JSON response
func (s *APIServer) respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// respondError sends an error response
func (s *APIServer) respondError(w http.ResponseWriter, status int, message string) {
	s.respondJSON(w, status, ErrorResponse{Error: message})
}
