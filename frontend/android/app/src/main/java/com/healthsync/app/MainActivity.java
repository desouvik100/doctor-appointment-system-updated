package com.healthsync.app;

import android.os.Bundle;
import android.view.WindowManager;
import android.graphics.Color;
import android.os.Build;
import android.webkit.WebView;
import android.webkit.WebSettings;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Set up native-like window before super.onCreate
        setupNativeWindow();
        
        // Enable WebView debugging for development
        WebView.setWebContentsDebuggingEnabled(true);
        
        super.onCreate(savedInstanceState);
        
        // Register plugins
        registerPlugin(GoogleAuth.class);
        
        // Configure WebView settings for payments (without overriding clients)
        configureWebViewSettings();
        
        // Apply native enhancements after bridge is ready
        applyNativeEnhancements();
    }

    private void setupNativeWindow() {
        // Prevent white flash on startup
        getWindow().setBackgroundDrawableResource(android.R.color.white);
        
        // Don't use edge-to-edge - let system bars have their space
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(true);
        }
        
        // Keep screen on during important operations
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    private void configureWebViewSettings() {
        // Get the WebView from Capacitor bridge
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            
            // Enable JavaScript (required for Razorpay)
            settings.setJavaScriptEnabled(true);
            
            // Enable DOM storage (required for Razorpay)
            settings.setDomStorageEnabled(true);
            
            // Allow mixed content (http in https) - needed for some payment flows
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            }
            
            // Enable JavaScript to open windows (for Razorpay popup)
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
            settings.setSupportMultipleWindows(true);
            
            // Enable file access
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
        }
    }

    private void applyNativeEnhancements() {
        // Set status bar color and style
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            getWindow().setStatusBarColor(Color.parseColor("#0ea5e9"));
            
            // Light status bar icons (white icons on colored background)
            WindowInsetsControllerCompat windowInsetsController = 
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            if (windowInsetsController != null) {
                windowInsetsController.setAppearanceLightStatusBars(false);
                windowInsetsController.setAppearanceLightNavigationBars(true);
            }
        }
        
        // Set navigation bar color
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getWindow().setNavigationBarColor(Color.WHITE);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-apply native enhancements when app resumes
        applyNativeEnhancements();
    }

    @Override
    public void onBackPressed() {
        // Let the web app handle back navigation first
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().evaluateJavascript(
                "(function() { " +
                "  if (window.history.length > 1) { " +
                "    window.history.back(); " +
                "    return true; " +
                "  } " +
                "  return false; " +
                "})();",
                result -> {
                    if (!"true".equals(result)) {
                        // No history, let system handle it
                        MainActivity.super.onBackPressed();
                    }
                }
            );
        } else {
            super.onBackPressed();
        }
    }
}
