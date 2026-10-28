package io.github.smonux.bmanostats;

import static org.junit.Assert.*;
import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Native checks to run after SDK licensing/build is available; not executed in Linux here. */
@RunWith(AndroidJUnit4.class)
public class PackageAssetsTest {
    @Test
    public void packagedModelAndFinalPermissions() throws Exception {
        Context app = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals("io.github.smonux.bmanostats", app.getPackageName());
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        long size = 0;
        try (InputStream model = app.getAssets().open("public/models/whistle.cact")) {
            byte[] buffer = new byte[65536];
            int count;
            while ((count = model.read(buffer)) != -1) {
                size += count;
                digest.update(buffer, 0, count);
            }
        }
        assertEquals(16919407L, size);
        StringBuilder hash = new StringBuilder();
        for (byte value : digest.digest()) hash.append(String.format("%02x", value & 0xff));
        assertEquals("b6e02f048568ac5d01a2042556c658061e699acbc0aa2a1439f52f3d461dffeb", hash.toString());
        for (String filename : app.getAssets().list("public/models"))
            assertFalse("Unused Needle weights in package", filename.startsWith("needle"));

        PackageInfo info = app.getPackageManager().getPackageInfo(app.getPackageName(), PackageManager.GET_PERMISSIONS);
        Set<String> allowed = new HashSet<>(Arrays.asList(
            "android.permission.INTERNET", "android.permission.RECORD_AUDIO",
            "android.permission.MODIFY_AUDIO_SETTINGS",
            app.getPackageName() + ".DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"
        ));
        assertNotNull(info.requestedPermissions);
        for (String permission : info.requestedPermissions)
            assertTrue("Unexpected merged permission: " + permission, allowed.contains(permission));
    }
}
