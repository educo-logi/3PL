package com.educo.pl33

import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.*
import android.widget.ProgressBar
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private val webUrl = "https://33pl.co.kr"

    override fun onCreate(savedInstanceState: Bundle?) {
        // 1. 스플래시 화면 설치
        installSplashScreen()
        
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)

        // 2. 뒤로가기 버튼 처리
        setupBackPressHandler()

        // 3. 웹뷰 설정 최적화
        setupWebView()

        // 4. 새로고침 리스너
        swipeRefreshLayout.setOnRefreshListener {
            webView.reload()
        }
    }

    private fun setupWebView() {
        val settings = webView.settings
        settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            javaScriptCanOpenWindowsAutomatically = true
            loadWithOverviewMode = true
            useWideViewPort = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        // 앱 접속 여부 감지를 위한 User-Agent 설정 (더 확실한 방식)
        val currentUA = settings.userAgentString ?: ""
        if (!currentUA.contains("33PL_APP_ANDROID")) {
            settings.userAgentString = "$currentUA 33PL_APP_ANDROID"
        }

        // 웹에서 네이티브 기능을 제어할 수 있는 브릿지 추가
        webView.addJavascriptInterface(WebAppInterface(this), "AndroidInterface")

        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url.toString()

                if (url.startsWith("http://") || url.startsWith("https://")) {
                    return false
                }

                try {
                    val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                    if (intent.resolveActivity(packageManager) != null) {
                        startActivity(intent)
                        return true
                    }
                    val packageName = intent.`package`
                    if (packageName != null) {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$packageName")))
                        return true
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
                return true
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                progressBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                progressBar.visibility = View.GONE
                swipeRefreshLayout.isRefreshing = false
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
            }
        }

        // 캐시 무효화를 위해 타임스탬프 추가
        val timestamp = System.currentTimeMillis()
        webView.clearCache(true)
        webView.loadUrl("$webUrl?v=$timestamp")
    }

    /**
     * 웹에서 호출 가능한 메인 인터페이스
     */
    inner class WebAppInterface(private val activity: MainActivity) {
        @JavascriptInterface
        fun setSwipeEnabled(isEnabled: Boolean) {
            activity.runOnUiThread {
                activity.swipeRefreshLayout.isEnabled = isEnabled
            }
        }
    }

    private fun setupBackPressHandler() {
        val callback = object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    showExitDialog()
                }
            }
        }
        onBackPressedDispatcher.addCallback(this, callback)
    }

    private fun showExitDialog() {
        AlertDialog.Builder(this)
            .setTitle("앱 종료")
            .setMessage("33PL 앱을 종료하시겠습니까?")
            .setPositiveButton("종료") { _, _ -> finish() }
            .setNegativeButton("취소", null)
            .show()
    }
}
