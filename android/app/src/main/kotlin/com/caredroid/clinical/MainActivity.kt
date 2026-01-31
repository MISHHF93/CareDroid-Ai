package com.caredroid.clinical

import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebChromeClient
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Enable immersive mode
        setupImmersiveMode()
        
        // Keep screen on
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        
        // Create WebView
        webView = WebView(this)
        setContentView(webView)
        
        // Configure WebView
        setupWebView()
        
        // Load app - Check for local assets first, fallback to development server
        val appUrl = if (BuildConfig.DEBUG) {
            "http://10.0.2.2:8001" // Android emulator localhost
        } else {
            "file:///android_asset/public/index.html"
        }
        webView.loadUrl(appUrl)
    }

    private fun setupWebView() {
        val settings: WebSettings = webView.settings
        
        // Enable JavaScript
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        
        // Enable database and cache (setAppCacheEnabled deprecated but removed)
        settings.databaseEnabled = true
        
        // Hardware acceleration
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        
        // Allow mixed content for development
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        
        // Enable zoom
        settings.setSupportZoom(true)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false
        
        // Enable media playback
        settings.mediaPlaybackRequiresUserGesture = false
        
        // WebView clients
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()
        
        // Enable debugging
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
    }

    private fun setupImmersiveMode() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.hide(WindowInsetsCompat.Type.systemBars())
        controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            @Suppress("DEPRECATION")
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        webView.destroy()
    }
}
