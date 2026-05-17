# HealthSync ProGuard Rules for Production

# React Native
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.** { *; }
-keep class com.facebook.react.bridge.** { *; }

# Keep native methods
-keepclassmembers class * {
    native <methods>;
}

# Hermes
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.hermes.**

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# Retrofit
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keepattributes Signature
-keepattributes Exceptions

# Gson
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# React Native Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }

# React Native Screens
-keep class com.swmansion.rnscreens.** { *; }

# React Native Maps
-keep class com.airbnb.android.react.maps.** { *; }

# React Native Camera
-keep class org.reactnative.camera.** { *; }

# React Native Vision Camera
-keep class com.mrousavy.camera.** { *; }

# React Native Image Picker
-keep class com.imagepicker.** { *; }

# React Native Document Picker
-keep class com.reactnativedocumentpicker.** { *; }

# React Native Keychain
-keep class com.oblador.keychain.** { *; }

# React Native Push Notifications
-keep class com.dieam.reactnativepushnotification.** { *; }

# React Native Linear Gradient
-keep class com.BV.LinearGradient.** { *; }

# React Native Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# React Native WebView
-keep class com.reactnativecommunity.webview.** { *; }

# React Native Async Storage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# React Native FBSDK
-keep class com.facebook.** { *; }
-dontwarn com.facebook.**

# Google Sign In
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Razorpay
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keep class proguard.annotation.Keep { *; }
-keep class proguard.annotation.KeepClassMembers { *; }
-keep class com.razorpay.** { *; }
-dontwarn com.razorpay.**

# Keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep model classes (adjust package name as needed)
-keep class com.healthsync.app.** { *; }

# Remove logging in release
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Keep annotations
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keepattributes Signature
-keepattributes Exceptions

# Crashlytics (if used)
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception
