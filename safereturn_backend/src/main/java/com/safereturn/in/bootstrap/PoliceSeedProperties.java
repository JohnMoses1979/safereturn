package com.safereturn.in.bootstrap;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "safereturn.seed")
public class PoliceSeedProperties {

    /**
     * Master switch for the police seeder.
     * Keep this disabled unless you want the app to create/update seed users on startup.
     */
    private boolean enabled = false;

    /**
     * Police accounts to seed into the database.
     */
    private List<PoliceAccount> police = new ArrayList<>();

    @Data
    public static class PoliceAccount {
        private String fullName;
        private String phone;
        private String email;
        private String password;
    }
}
