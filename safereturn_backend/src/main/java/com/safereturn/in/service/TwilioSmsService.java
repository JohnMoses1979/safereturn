package com.safereturn.in.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Thin wrapper around the Twilio Java SDK.
 *
 * Required application.properties entries:
 *   twilio.account-sid=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   twilio.auth-token=your_auth_token
 *   twilio.from-number=+1XXXXXXXXXX
 *
 * For local development / testing without a real Twilio account,
 * set twilio.mock=true in application.properties and the SMS will
 * only be logged to the console.
 */
@Service
public class TwilioSmsService {

    private static final Logger log = LoggerFactory.getLogger(TwilioSmsService.class);

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.from-number}")
    private String fromNumber;

    @Value("${twilio.mock:false}")
    private boolean mockMode;

    @PostConstruct
    private void init() {
        if (mockMode) {
            log.warn("Twilio SMS service running in MOCK mode - messages will NOT be sent.");
            return;
        }

        if (!StringUtils.hasText(accountSid) || !StringUtils.hasText(authToken) || !StringUtils.hasText(fromNumber)) {
            log.warn("Twilio credentials are missing. Falling back to MOCK mode so OTPs are logged locally.");
            mockMode = true;
            return;
        }

        try {
            Twilio.init(accountSid, authToken);
            log.info("Twilio SMS service initialised (live mode).");
        } catch (Exception ex) {
            log.warn("Twilio init failed. Falling back to MOCK mode: {}", ex.getMessage());
            mockMode = true;
        }
    }

    /**
     * Send an OTP SMS to an Indian mobile number.
     *
     * @param toPhone 10-digit phone number (without country code)
     * @param otp 6-digit OTP code
     */
    public void sendOtp(String toPhone, String otp) {
        String toE164 = "+91" + toPhone;
        String body = String.format(
            "Your SafeReturn verification code is: %s\nValid for 5 minutes. Do not share this with anyone.",
            otp
        );

        if (mockMode) {
            log.info("[MOCK SMS] To: {} | Body: {}", toE164, body);
            return;
        }

        try {
            Message message = Message.creator(
                new PhoneNumber(toE164),
                new PhoneNumber(fromNumber),
                body
            ).create();

            log.info("OTP SMS sent. SID={} Status={}", message.getSid(), message.getStatus());
        } catch (Exception ex) {
            log.error("Failed to send OTP SMS to {}: {}", toE164, ex.getMessage(), ex);
            throw new RuntimeException("Unable to send OTP right now. Please try again in a moment.", ex);
        }
    }
}
