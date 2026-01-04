package com.exadel.frs;

import static com.exadel.frs.commonservice.enums.GlobalRole.USER;
import static java.time.LocalDateTime.now;
import static java.time.ZoneOffset.UTC;
import static java.time.temporal.ChronoUnit.MILLIS;
import com.exadel.frs.commonservice.entity.App;
import com.exadel.frs.commonservice.entity.ResetPasswordToken;
import com.exadel.frs.commonservice.entity.User;
import com.exadel.frs.commonservice.enums.GlobalRole;
import com.exadel.frs.commonservice.repository.UserRepository;
import com.exadel.frs.repository.AppRepository;
import com.exadel.frs.repository.ResetPasswordTokenRepository;
import com.exadel.frs.testutil.BaseDbHelper;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class DbHelper extends BaseDbHelper {

    @Value("${forgot-password.reset-password-token.expires}")
    private long resetPasswordTokenExpires;

    @Autowired
    UserRepository userRepository;

    @Autowired
    ResetPasswordTokenRepository resetPasswordTokenRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    AppRepository appRepository;

    @Override
    protected App saveApp(App app) {
        return appRepository.save(app);
    }

    public User insertUser(String email) {
        return insertUser(email, USER);
    }

    public User insertUser(String email, GlobalRole role) {
        var user = createUser(email, role);
        user.setEnabled(true);
        return userRepository.saveAndFlush(user);
    }

    public User insertUnconfirmedUser(String email) {
        return insertUnconfirmedUser(email, USER);
    }

    public User insertUnconfirmedUser(String email, GlobalRole role) {
        var user = createUser(email, role);
        user.setRegistrationToken(UUID.randomUUID().toString());
        return userRepository.saveAndFlush(user);
    }

    private User createUser(String email, GlobalRole role) {
        return User.builder()
                   .email(email)
                   .firstName("firstName")
                   .lastName("lastName")
                   .password(encoder.encode("1234567890"))
                   .guid(UUID.randomUUID().toString())
                   .accountNonExpired(true)
                   .accountNonLocked(true)
                   .credentialsNonExpired(true)
                   .allowStatistics(true)
                   .globalRole(role)
                   .build();
    }

    public ResetPasswordToken insertResetPasswordToken(User user) {
        var expiresIn = now(UTC).plus(resetPasswordTokenExpires, MILLIS);
        var token = new ResetPasswordToken(expiresIn, user);
        return resetPasswordTokenRepository.saveAndFlush(token);
    }

    public ResetPasswordToken insertResetPasswordToken(User user, LocalDateTime expiresIn) {
        var token = new ResetPasswordToken(expiresIn, user);
        return resetPasswordTokenRepository.saveAndFlush(token);
    }
}
