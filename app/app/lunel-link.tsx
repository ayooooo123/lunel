import { ArrowLeft, AlertCircle, Camera, Terminal as TerminalIcon, Key, AlertTriangle as AlertCircleIcon } from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  InputAccessoryView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useConnection } from "../contexts/ConnectionContext";
import { useTheme } from "@/contexts/ThemeContext";

const { width } = Dimensions.get("window");
const WHITE = "#FFFFFF";
const PURPLE = "#725CAD";
const BLACK = "#000000";
const GRAY = "#808080";
const RED = "#FF4444";

const LunelLink = () => {
  const router = useRouter();
  const { radius } = useTheme();
  const { connect, status, error: connectionError, capabilities } = useConnection();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (permission && !permission.granted && !hasRequestedPermission) {
      requestPermission();
      setHasRequestedPermission(true);
    }
  }, [permission, requestPermission, hasRequestedPermission]);

  // Navigate to editor once connected
  useEffect(() => {
    if (status === 'connected' && capabilities) {
      router.replace("/workspace");
    }
  }, [status, capabilities, router]);

  // Update error state from connection
  useEffect(() => {
    if (connectionError) {
      setError(connectionError);
      setIsConnecting(false);
    }
  }, [connectionError]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scanned && !isConnecting) {
      setScanned(true);
      console.log("QR Code Scanned:", data);
      setManualCode(data);
      // Auto-connect after scanning
      handleConnectWithCode(data);
    }
  };

  const handleConnectWithCode = async (code: string) => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      Alert.alert("Input Required", "Please scan a QR code or enter a code");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await connect(trimmedCode);
      // Navigation happens in useEffect when status becomes 'connected'
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      setError(msg);
      setScanned(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnect = () => {
    handleConnectWithCode(manualCode);
  };

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: BLACK }} />;
  }

  const isButtonDisabled = !manualCode.trim() || isConnecting;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={BLACK} />
      <View style={styles.content}>
        <View style={[styles.scannerContainer, { borderRadius: radius.xl }]}>
          {permission.granted && (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={scanned || isConnecting ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
            />
          )}

          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={WHITE} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Connect your Codebase</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft, { borderTopLeftRadius: radius.md }]} />
            <View style={[styles.corner, styles.cornerTopRight, { borderTopRightRadius: radius.md }]} />
            <View style={[styles.corner, styles.cornerBottomLeft, { borderBottomLeftRadius: radius.md }]} />
            <View style={[styles.corner, styles.cornerBottomRight, { borderBottomRightRadius: radius.md }]} />

            {!permission.granted && (
              <View style={[styles.permissionOverlay, { borderRadius: radius.md }]}>
                <AlertCircle size={48} color={WHITE} strokeWidth={1.5} />
                <Text style={styles.permissionOverlayTitle}>
                  Camera Access Required
                </Text>
                <Text style={styles.permissionOverlayText}>
                  Please grant camera access to scan QR codes
                </Text>
                <TouchableOpacity
                  onPress={requestPermission}
                  style={[styles.permissionRetryButton, { borderRadius: radius.full }]}
                >
                  <Camera
                    size={20}
                    color={WHITE}
                    strokeWidth={2}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.permissionRetryButtonText}>
                    Request Access
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {(scanned || isConnecting) && (
              <View style={styles.scanningOverlay}>
                <ActivityIndicator size={40} color={WHITE} />
                <Text style={styles.connectingText}>
                  {isConnecting ? "Connecting..." : "Processing..."}
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.instructionContainer, { borderRadius: radius.lg }]}>
            <TerminalIcon
              size={16}
              color={WHITE}
              strokeWidth={2}
              style={styles.buttonIcon}
            />
            <Text style={styles.instructionText}>Run </Text>
            <View style={[styles.codeWrapper, { borderRadius: radius.sm }]}>
              <Text style={styles.codeText}>npx lunel-cli</Text>
            </View>
            <Text style={styles.instructionText}> to generate QR code</Text>
          </View>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.inputContainer}>
          {error && (
            <View style={[styles.errorContainer, { borderRadius: radius.md }]}>
              <AlertCircleIcon size={16} color={RED} strokeWidth={2} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={[styles.inputWrapper, { borderRadius: radius.lg }]}>
            <Key
              size={20}
              color={GRAY}
              strokeWidth={2}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your Lunel link code here!"
              placeholderTextColor={GRAY}
              value={manualCode}
              onChangeText={(text) => {
                setManualCode(text);
                setError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isConnecting}
              inputAccessoryViewID="lunel_link_input"
            />
            
            <InputAccessoryView nativeID="lunel_link_input" backgroundColor={BLACK}>
              <View style={{ height: 0 }} />
            </InputAccessoryView>
          </View>

          <TouchableOpacity
            onPress={handleConnect}
            style={[
              styles.connectButton,
              { opacity: isButtonDisabled ? 0.5 : 1, borderRadius: radius.full },
            ]}
            disabled={isButtonDisabled}
          >
            {isConnecting ? (
              <ActivityIndicator size="small" color={WHITE} />
            ) : (
              <Text style={styles.connectButtonText}>Connect Now</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  content: {
    flex: 1,
    backgroundColor: BLACK,
  },
  scannerContainer: {
    flex: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerSpacer: {
    width: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: WHITE,
  },
  scanFrame: {
    position: "absolute",
    width: width * 0.6,
    height: width * 0.6,
    top: "50%",
    left: "50%",
    marginTop: -(width * 0.3),
    marginLeft: -(width * 0.3),
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: WHITE,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  instructionContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  instructionText: {
    fontSize: 13,
    color: WHITE,
    textAlign: "center",
    lineHeight: 18,
    opacity: 0.9,
  },
  codeWrapper: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginHorizontal: 4,
  },
  codeText: {
    fontFamily: "monospace",
    fontWeight: "700",
    fontSize: 13,
    color: WHITE,
  },
  buttonIcon: {
    marginRight: 8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: "500",
    color: WHITE,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  errorText: {
    color: RED,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: WHITE,
  },
  connectButton: {
    backgroundColor: PURPLE,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  connectButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "600",
  },
  connectingText: {
    color: WHITE,
    fontSize: 14,
    marginTop: 12,
    opacity: 0.9,
  },
  permissionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  permissionOverlayTitle: {
    color: WHITE,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 6,
    textAlign: "center",
  },
  permissionOverlayText: {
    color: WHITE,
    fontSize: 11,
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 16,
    marginBottom: 2,
  },
  permissionRetryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PURPLE,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 12,
  },
  permissionRetryButtonText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: "600",
  },
  scanningOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
});

export default LunelLink;
