import React from "react";
import { Paper, Typography, Grid, Divider } from "@mui/material";

const ProductInfo = ({ product }) => {
  if (!product) {
    return null;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 500, mx: "auto", my: 2 }}>
      <Typography variant="h5" gutterBottom>
        Product Information
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle1" color="text.secondary">
            Product Name
          </Typography>
          <Typography variant="body1">{product.name || "N/A"}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle1" color="text.secondary">
            Calories
          </Typography>
          <Typography variant="body1">{product.calories || "N/A"}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle1" color="text.secondary">
            Country of Origin
          </Typography>
          <Typography variant="body1">{product.origin || "N/A"}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle1" color="text.secondary">
            Production Date
          </Typography>
          <Typography variant="body1">
            {product.productionDate || "N/A"}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle1" color="text.secondary">
            Expiry Date
          </Typography>
          <Typography variant="body1">{product.expiryDate || "N/A"}</Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ProductInfo;
