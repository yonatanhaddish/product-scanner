"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
} from "@mui/material";

const BarcodeScanner = () => {
  const [scannerState, setScannerState] = useState({
    isScanning: false,
    isCameraOn: false,
    isLoading: false,
    error: null,
    scannedCode: "",
    productInfo: null,
  });
  const videoRef = useRef(null);
  const codeReader = useRef(null);
  const lastScannedCode = useRef(null);

  const searchProduct = useCallback(async (barcode) => {
    if (lastScannedCode.current === barcode) {
      console.log("🔄 Skipping duplicate API call for barcode:", barcode);
      return;
    }
    lastScannedCode.current = barcode;

    try {
      setScannerState((prev) => ({ ...prev, isLoading: true, error: null }));

      console.log("🔍 Searching for barcode:", barcode);
      console.log(
        "📡 Calling API:",
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );

      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await response.json();

      console.log("📦 API Response:", data);

      if (data.status === 1) {
        console.log("✅ Product found:", data.product.product_name);
        setScannerState((prev) => ({
          ...prev,
          isLoading: false,
          productInfo: {
            name: data.product.product_name,
            brand: data.product.brands,
            image: data.product.image_url,
            ingredients: data.product.ingredients_text,
            nutrition: data.product.nutriments,
          },
        }));
      } else {
        console.log("❌ Product not found in database");
        setScannerState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Product not found in database",
        }));
      }
    } catch (err) {
      console.error("🚨 API error:", err);
      setScannerState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to fetch product information",
      }));
    }
  }, []);

  const startScanning = useCallback(async () => {
    try {
      console.log("📸 Starting scanner...");
      lastScannedCode.current = null;
      setScannerState((prev) => ({
        ...prev,
        error: null,
        scannedCode: "",
        productInfo: null,
        isScanning: true,
      }));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScannerState((prev) => ({ ...prev, isCameraOn: true }));
      }

      codeReader.current = new BrowserMultiFormatReader();

      await codeReader.current.decodeFromVideoDevice(
        null,
        videoRef.current,
        async (result, err) => {
          if (result) {
            const barcode = result.getText();
            setScannerState((prev) => ({ ...prev, scannedCode: barcode }));
            stopScanning();
            await searchProduct(barcode);
          }
          if (err && !(err instanceof Error)) {
            console.error("Scanning error:", err);
          }
        }
      );
    } catch (err) {
      console.error("Camera error:", err);
      setScannerState((prev) => ({
        ...prev,
        error: err.message || "Failed to start scanner",
        isScanning: false,
        isCameraOn: false,
      }));
    }
  }, [searchProduct]);

  const stopScanning = useCallback(() => {
    try {
      setScannerState((prev) => ({
        ...prev,
        isScanning: false,
        isCameraOn: false,
      }));

      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }

      if (codeReader.current) {
        try {
          codeReader.current.stopAsyncDecode();
          codeReader.current.stopContinuousDecode();
        } catch (e) {}
        codeReader.current = null;
      }
    } catch (err) {
      console.error("Error stopping scanner:", err);
      setScannerState((prev) => ({
        ...prev,
        error: "Error stopping scanner: " + (err.message || "Unknown error"),
      }));
    }
  }, []);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  const { isScanning, isCameraOn, isLoading, error, scannedCode, productInfo } =
    scannerState;

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          position: "relative",
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          Product Scanner
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            position: "relative",
            height: "300px",
            backgroundColor: "#000",
            borderRadius: 1,
            overflow: "hidden",
            display: isCameraOn ? "block" : "none",
            flex: "0 0 auto",
          }}
        >
          <video
            ref={videoRef}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            autoPlay
            playsInline
            muted
          />
          {isScanning && (
            <>
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  backgroundColor: "#1976d2",
                  animation: "scan 2s linear infinite",
                  "@keyframes scan": {
                    "0%": { transform: "translateY(0)" },
                    "100%": { transform: "translateY(300px)" },
                  },
                }}
              />
              <Typography
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "#fff",
                  textAlign: "center",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  padding: "8px 16px",
                  borderRadius: 1,
                }}
              >
                Point camera at barcode
              </Typography>
            </>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            my: 2,
            position: "sticky",
            top: 0,
            backgroundColor: "white",
            zIndex: 1,
            py: 1,
          }}
        >
          <Button
            variant="contained"
            color={isScanning ? "error" : "primary"}
            onClick={isScanning ? stopScanning : startScanning}
            startIcon={<span>{isScanning ? "⏹️" : "📷"}</span>}
            disabled={isLoading}
            sx={{ minWidth: "200px" }}
          >
            {isScanning ? "Stop Scanning" : "Start Scanning"}
          </Button>
        </Box>

        {isLoading && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              my: 2,
            }}
          >
            <CircularProgress size={24} />
            <Typography variant="body2">
              Searching product database...
            </Typography>
          </Box>
        )}

        {productInfo && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 2,
              flex: 1,
            }}
          >
            <Alert severity="success">Product found!</Alert>

            {productInfo.image && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  width: "100%",
                  height: "200px",
                  overflow: "hidden",
                  borderRadius: 1,
                  backgroundColor: "#f5f5f5",
                }}
              >
                <img
                  src={productInfo.image}
                  alt={productInfo.name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                  loading="lazy"
                />
              </Box>
            )}

            <Typography variant="h6">{productInfo.name}</Typography>

            {productInfo.brand && (
              <Typography variant="body1" color="text.secondary">
                Brand: {productInfo.brand}
              </Typography>
            )}

            {productInfo.ingredients && (
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  Ingredients:
                </Typography>
                <Typography variant="body2">
                  {productInfo.ingredients}
                </Typography>
              </Box>
            )}

            {productInfo.nutrition && (
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  Nutrition Facts (per 100g):
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 1,
                    mt: 1,
                  }}
                >
                  <Typography variant="body2">
                    Energy: {productInfo.nutrition.energy_100g || "N/A"} kcal
                  </Typography>
                  <Typography variant="body2">
                    Fat: {productInfo.nutrition.fat_100g || "N/A"}g
                  </Typography>
                  <Typography variant="body2">
                    Carbs: {productInfo.nutrition.carbohydrates_100g || "N/A"}g
                  </Typography>
                  <Typography variant="body2">
                    Protein: {productInfo.nutrition.proteins_100g || "N/A"}g
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {scannedCode && !productInfo && !isLoading && (
          <Alert severity="info">Scanned barcode: {scannedCode}</Alert>
        )}
      </Paper>
    </Container>
  );
};

export default BarcodeScanner;
