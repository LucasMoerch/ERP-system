package com.p3.Enevold.users;

import com.p3.Enevold.utils.FileDocument;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class UserTest {

    @Test
    void authGettersAndSettersWork() {
        User.Auth auth = new User.Auth();
        auth.setProvider("google");
        auth.setSub("sub-123");
        auth.setEmail("test@example.com");
        auth.setEmailVerified(true);
        auth.setPictureUrl("http://example.com/pic.png");

        assertEquals("google", auth.getProvider());
        assertEquals("sub-123", auth.getSub());
        assertEquals("test@example.com", auth.getEmail());
        assertTrue(auth.isEmailVerified());
        assertEquals("http://example.com/pic.png", auth.getPictureUrl());
    }

    @Test
    void profileGettersAndSettersWork() {
        User.Profile profile = new User.Profile();
        profile.setFirstName("Alice");
        profile.setLastName("Smith");
        profile.setDisplayName("Alice S.");
        profile.setPhone("12345678");
        profile.setLocale("da-DK");
        profile.setBirthDate("2000-01-01");
        profile.setAddress("Some Street 1");
        profile.setCPR("123456-7890");
        profile.setBankReg("1234");
        profile.setBankNumber("567890");

        assertEquals("Alice", profile.getFirstName());
        assertEquals("Smith", profile.getLastName());
        assertEquals("Alice S.", profile.getDisplayName());
        assertEquals("12345678", profile.getPhone());
        assertEquals("da-DK", profile.getLocale());
        assertEquals("2000-01-01", profile.getBirthDate());
        assertEquals("Some Street 1", profile.getAddress());
        assertEquals("123456-7890", profile.getCPR());
        assertEquals("1234", profile.getBankReg());
        assertEquals("567890", profile.getBankNumber());
    }

    @Test
    void userRootFieldsAndDocumentsWork() {
        User user = new User();

        user.setRoles(List.of("staff", "admin"));
        user.setStatus("active");

        User.Auth auth = new User.Auth();
        auth.setEmail("user@example.com");
        user.setAuth(auth);

        User.Profile profile = new User.Profile();
        profile.setDisplayName("User One");
        user.setProfile(profile);

        FileDocument doc = new FileDocument();
        user.setDocuments(List.of(doc));

        assertEquals(List.of("staff", "admin"), user.getRoles());
        assertEquals("active", user.getStatus());
        assertEquals("user@example.com", user.getAuth().getEmail());
        assertEquals("User One", user.getProfile().getDisplayName());
        assertNotNull(user.getDocuments());
        assertEquals(1, user.getDocuments().size());
        assertSame(doc, user.getDocuments().get(0));
    }
}
