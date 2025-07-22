package fun.fest2.event.invitations.qrCreation;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.qrcode.QRCodeWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class QrService {

    private static final Logger logger = LoggerFactory.getLogger(QrService.class);
    private static final int QR_WIDTH = 300;
    private static final int QR_HEIGHT = 300;

    public byte[] generateQRCode(String content) {
        long startTime = System.nanoTime();
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            var bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, QR_WIDTH, QR_HEIGHT);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);

            byte[] qrImage = outputStream.toByteArray();
            double durationMs = (System.nanoTime() - startTime) / 1_000_000.0;
            logger.info("QR code generated: content={}, duration={} ms", content, durationMs);
            return qrImage;

        } catch (WriterException | IOException e) {
            double durationMs = (System.nanoTime() - startTime) / 1_000_000.0;
            logger.error("Failed to generate QR code: content={}, error={}, duration={} ms",
                    content, e.getMessage(), durationMs);
            throw new RuntimeException("Failed to generate QR code for content: " + content, e);
        }
    }
}