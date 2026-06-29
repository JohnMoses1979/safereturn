package com.safereturn.in.bootstrap;

import java.util.List;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.safereturn.in.entity.User;
import com.safereturn.in.repository.UserRepository;

@Component
public class PoliceUserSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PoliceUserSeeder.class);

    private final PoliceSeedProperties seedProperties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public PoliceUserSeeder(PoliceSeedProperties seedProperties,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.seedProperties = seedProperties;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!seedProperties.isEnabled()) {
            log.debug("Police seeder is disabled.");
            return;
        }

        List<PoliceSeedProperties.PoliceAccount> policeAccounts = seedProperties.getPolice();
        if (policeAccounts == null || policeAccounts.isEmpty()) {
            log.warn("Police seeder is enabled, but no police accounts were configured.");
            return;
        }

        int createdCount = 0;

        for (PoliceSeedProperties.PoliceAccount account : policeAccounts) {
            if (account == null) {
                continue;
            }

            String fullName = safeTrim(account.getFullName());
            String phone = normalizePhone(account.getPhone());
            String email = normalizeEmail(account.getEmail());
            String rawPassword = safeTrim(account.getPassword());

            if (!StringUtils.hasText(fullName) || !StringUtils.hasText(phone)
                    || !StringUtils.hasText(email) || !StringUtils.hasText(rawPassword)) {
                log.warn("Skipping police seed entry because one or more required fields are blank.");
                continue;
            }

            if (userRepository.existsByEmail(email)) {
                log.info("Skipping police seed for {} because that email already exists.", email);
                continue;
            }

            if (userRepository.existsByPhone(phone)) {
                log.info("Skipping police seed for {} because that phone already exists.", maskPhone(phone));
                continue;
            }

            User user = User.builder()
                    .fullName(fullName)
                    .phone(phone)
                    .email(email)
                    .password(passwordEncoder.encode(rawPassword))
                    .enabled(true)
                    .phoneVerified(true)
                    .emailVerified(true)
                    .role(User.Role.POLICE)
                    .build();

            userRepository.save(user);
            createdCount++;

            log.info("Seeded police account: {} ({})", fullName, email);
        }

        log.info("Police seed complete. Created {} account(s).", createdCount);
    }

    private String safeTrim(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeEmail(String email) {
        return safeTrim(email) == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePhone(String phone) {
        return safeTrim(phone);
    }

    private String maskPhone(String phone) {
        if (!StringUtils.hasText(phone) || phone.length() < 4) {
            return "******";
        }
        return "******" + phone.substring(phone.length() - 4);
    }
}
