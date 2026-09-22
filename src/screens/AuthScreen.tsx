import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BackgroundDecorations from '../components/common/BackgroundDecorations';
import AuthTabs from '../components/auth/AuthTabs';
import SignUpForm from '../components/auth/SignUpForm';
import LoginForm from '../components/auth/LoginForm';
import OtpVerification from '../components/auth/OtpVerification';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import { Mode, FormState, FormErrors, StatusMessage } from '../types/auth';
import { INITIAL_FORM } from '../constants/auth';
import { COLORS } from '../constants/colors';
import { validateAuthForm } from '../utils/validation';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signup');
  const [authStep, setAuthStep] = useState<'form' | 'otp' | 'forgot_password'>('form');
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Auto-scroll when any input is focused so that the active typing block is completely visible above the keyboard
  const handleFieldFocus = (yOffset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: yOffset,
        animated: true,
      });
    }, Platform.OS === 'ios' ? 80 : 120);
  };

  // Field updater
  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (statusMessage) setStatusMessage(null);
  };

  // Submit handler: validates form and either logs in directly or transitions to 6-digit OTP verification for registration
  const handleSubmit = async () => {
    setStatusMessage(null);
    const { isValid, errors: validationErrors } = validateAuthForm(mode, form);

    if (!isValid) {
      setErrors(validationErrors);
      setStatusMessage({
        type: 'error',
        text: 'Please fix the highlighted fields and try again.',
      });
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        // Direct login without OTP verification
        await new Promise((resolve) => setTimeout(resolve, 800));
        setStatusMessage({
          type: 'success',
          text: 'Logged in successfully! Welcome back.',
        });
      } else {
        // Registration / Sign Up flow: proceed to 6-digit OTP verification
        await new Promise((resolve) => setTimeout(resolve, 800));
        setAuthStep('otp');
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text:
          mode === 'login'
            ? 'Login failed. Please check your credentials.'
            : 'Unable to send OTP. Please check your network and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifySuccess = () => {
    setAuthStep('form');
    setStatusMessage({
      type: 'success',
      text: 'Account verified and created successfully! Welcome to HiHubble.',
    });
    setForm(INITIAL_FORM);
  };

  // ------------------------------------------------------------------
  // 3D Single-Rotation Flip Animation with Clean Shadow Transition
  // ------------------------------------------------------------------
  const flipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isFlipping = useRef(false);

  const switchMode = (nextMode: Mode) => {
    if (nextMode === mode || isFlipping.current) return;
    isFlipping.current = true;

    // Direction: signup -> login rotates +90°, login -> signup rotates -90°
    const direction = nextMode === 'login' ? 1 : -1;

    Animated.parallel([
      Animated.timing(flipAnim, {
        toValue: direction * 90,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.94,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Midway point: card is edge-on to the screen; swap form content
      setMode(nextMode);
      setAuthStep('form');
      setErrors({});
      setStatusMessage(null);
      flipAnim.setValue(-direction * 90);

      Animated.parallel([
        Animated.timing(flipAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        isFlipping.current = false;
      });
    });
  };

  const rotateY = flipAnim.interpolate({
    inputRange: [-90, 0, 90],
    outputRange: ['-90deg', '0deg', '90deg'],
  });

  const animatedCardStyle = {
    transform: [
      { perspective: 1000 },
      { scale: scaleAnim },
      { rotateY },
    ],
  };

  // Eliminates background shadow during 3D flip:
  // When card rotates away from 0deg, shadow smoothly fades to 0% opacity
  const shadowOpacity = flipAnim.interpolate({
    inputRange: [-90, -45, 0, 45, 90],
    outputRange: [0, 0, 1, 0, 0],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Lavender gradient & floating decorative shapes */}
      <BackgroundDecorations />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 36 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          {/* Header: Mascot + 3D Logo floating directly on background */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/hihubble-logo.png')}
              style={styles.headerImage}
              resizeMode="contain"
            />
            {/* Tagline Pill Badge: CONNECT • SHARE • BELONG */}
            <View style={styles.taglineBadge}>
              <Text style={styles.taglineText}>CONNECT</Text>
              <View style={styles.taglineDot} />
              <Text style={styles.taglineText}>SHARE</Text>
              <View style={styles.taglineDot} />
              <Text style={styles.taglineText}>BELONG</Text>
            </View>
          </View>

          {/* Card Container with Dynamic Shadow Layer */}
          <View style={styles.cardWrapper}>
            {/* Underlying shadow layer that fades out completely during rotation */}
            <Animated.View style={[styles.cardShadowLayer, { opacity: shadowOpacity }]} />

            {/* Rotating 3D Card (zero shadow on the card itself so no background artifacts appear) */}
            <Animated.View style={[styles.card, animatedCardStyle]}>
              {authStep === 'otp' ? (
                /* 6-Digit OTP Verification Screen */
                <OtpVerification
                  targetDestination={form.mobile || form.email}
                  onVerifySuccess={handleVerifySuccess}
                  onBackToForm={() => setAuthStep('form')}
                />
              ) : authStep === 'forgot_password' ? (
                /* Forgot Password: Email OTP & Create New Password Screen */
                <ForgotPasswordForm
                  initialEmail={form.email}
                  onBackToLogin={() => setAuthStep('form')}
                  onResetSuccess={() => {
                    setAuthStep('form');
                    setMode('login');
                    setStatusMessage({
                      type: 'success',
                      text: 'Password reset successfully! Please log in with your new password.',
                    });
                  }}
                  onFieldFocus={handleFieldFocus}
                />
              ) : (
                /* Standard Sign Up / Login Form */
                <>
                  {/* Tabs (Sign Up left, Login right) */}
                  <AuthTabs mode={mode} onSwitchMode={switchMode} />

                  {/* Status banner */}
                  {statusMessage && (
                    <View
                      style={[
                        styles.statusBanner,
                        statusMessage.type === 'success'
                          ? styles.statusSuccess
                          : styles.statusError,
                      ]}
                    >
                      <Ionicons
                        name={statusMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                        size={18}
                        color={statusMessage.type === 'success' ? COLORS.SUCCESS_TEXT : COLORS.ERROR_TEXT}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          statusMessage.type === 'success'
                            ? styles.statusTextSuccess
                            : styles.statusTextError,
                        ]}
                      >
                        {statusMessage.text}
                      </Text>
                    </View>
                  )}

                  {/* Form Content */}
                  {mode === 'signup' ? (
                    <SignUpForm
                      form={form}
                      errors={errors}
                      submitting={submitting}
                      onUpdateField={updateField}
                      onSubmit={handleSubmit}
                      onFieldFocus={handleFieldFocus}
                    />
                  ) : (
                    <LoginForm
                      form={form}
                      errors={errors}
                      submitting={submitting}
                      onUpdateField={updateField}
                      onSubmit={handleSubmit}
                      onForgotPassword={() => setAuthStep('forgot_password')}
                      onFieldFocus={handleFieldFocus}
                    />
                  )}
                </>
              )}
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.PURPLE_SOFT,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  headerImage: {
    width: 270,
    height: 116,
  },
  taglineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.WHITE,
    borderWidth: 1.5,
    borderColor: COLORS.PURPLE_BORDER,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 16,
    marginTop: -8,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    alignSelf: 'center',
  },
  taglineText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: 1.2,
  },
  taglineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.PURPLE_LIGHT,
    marginHorizontal: 8,
  },
  cardWrapper: {
    position: 'relative',
    width: '100%',
  },
  // Separate shadow layer behind the card that smoothly fades to 0 during flip
  cardShadowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  // The rotating card itself has NO shadow/elevation attached, preventing background shadow streaks during 3D flip
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    backfaceVisibility: 'hidden',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    gap: 8,
  },
  statusSuccess: {
    backgroundColor: COLORS.SUCCESS_BG,
  },
  statusError: {
    backgroundColor: COLORS.ERROR_BG,
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  statusTextSuccess: {
    color: COLORS.SUCCESS_TEXT,
  },
  statusTextError: {
    color: COLORS.ERROR_TEXT,
  },
});
