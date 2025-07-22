package fun.fest2.event.invitations.s3Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.net.URI;
import java.net.URLDecoder;
import java.time.Duration;
import java.util.UUID;

@Service
public class S3Service {

    private static final Logger logger = LoggerFactory.getLogger(S3Service.class);
    private static final int MAX_RETRIES = 3;
    private static final long BASE_RETRY_DELAY_MS = 100;

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final String bucketName;

    public S3Service(S3Client s3Client, S3Presigner s3Presigner, @Value("${aws.s3.bucket}") String bucketName) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.bucketName = bucketName;
    }

    public String uploadQrImage(byte[] qrImage, String eventId, String invitationId) {
        String key = String.format("fest2fun/%s/qrImages/%s.png", eventId, invitationId);
        return uploadFile(qrImage, key, "image/png");
    }

    public String uploadEmailHtml(String htmlContent, String eventId, String invitationId) {
        String key = String.format("fest2fun/%s/emailHTML/%s.html", eventId, invitationId);
        return uploadFile(htmlContent.getBytes(), key, "text/html");
    }

    private String uploadFile(byte[] content, String key, String contentType) {
        long startTime = System.nanoTime();
        int attempt = 0;

        while (attempt < MAX_RETRIES) {
            try {
                logger.info("Uploading to S3: key={}, attempt={}", key, attempt + 1);
                PutObjectRequest request = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .contentType(contentType)
                        .build();

                s3Client.putObject(request, RequestBody.fromBytes(content));

                String presignedUrl = generatePresignedUrl(key);
                double durationMs = (System.nanoTime() - startTime) / 1_000_000.0;
                logger.info("S3 upload successful: key={}, url={}, duration={} ms", key, presignedUrl, durationMs);
                return presignedUrl;

            } catch (Exception e) {
                attempt++;
                if (attempt == MAX_RETRIES) {
                    double durationMs = (System.nanoTime() - startTime) / 1_000_000.0;
                    logger.error("S3 upload failed after {} attempts: key={}, error={}, duration={} ms",
                            MAX_RETRIES, key, e.getMessage(), durationMs);
                    throw new RuntimeException("Failed to upload to S3: " + key, e);
                }
                try {
                    long delay = BASE_RETRY_DELAY_MS * (1L << attempt);
                    logger.warn("S3 upload retry: key={}, attempt={}, delay={} ms", key, attempt + 1, delay);
                    Thread.sleep(delay);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Interrupted during S3 retry", ie);
                }
            }
        }
        throw new RuntimeException("Unexpected S3 upload failure: " + key);
    }

    public String generatePresignedUrl(String key) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofDays(7))
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
            return presignedRequest.url().toString();
        } catch (Exception e) {
            logger.error("Failed to generate pre-signed URL: key={}, error={}", key, e.getMessage());
            throw new RuntimeException("Failed to generate pre-signed URL: " + key, e);
        }
    }

    public String generateFileName() {
        return UUID.randomUUID().toString();
    }

    public byte[] downloadQrImage(String key) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();

        ResponseBytes<GetObjectResponse> objectBytes = s3Client.getObjectAsBytes(getObjectRequest);
        return objectBytes.asByteArray();
    }

    public String downloadEmailHtml(String key) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();

        ResponseBytes<GetObjectResponse> objectBytes = s3Client.getObjectAsBytes(getObjectRequest);
        return objectBytes.asUtf8String();
    }

    public String getHtmlContentFromS3(String htmlUrl) {
        long startTime = System.nanoTime();
        try {
            // Extract the S3 key from the htmlUrl
            String key = extractKeyFromUrl(htmlUrl);
            logger.info("Retrieving HTML content from S3: key={}", key);

            // Use the existing downloadEmailHtml method to fetch the content
            String htmlContent = downloadEmailHtml(key);

            double durationMs = (System.nanoTime() - startTime) / 1_000_000.0;
            logger.info("Successfully retrieved HTML content from S3: key={}, duration={} ms", key, durationMs);
            return htmlContent;

        } catch (Exception e) {
            double durationMs = (System.nanoTime() - startTime) / 1_000_000.0;
            logger.error("Failed to retrieve HTML content from S3: url={}, error={}, duration={} ms",
                    htmlUrl, e.getMessage(), durationMs);
            return null;
        }
    }

    private String extractKeyFromUrl(String htmlUrl) {
        try {
            URI uri = new URI(htmlUrl);
            String path = uri.getPath();
            // Remove leading slash if present
            if (path.startsWith("/")) path = path.substring(1);
            return URLDecoder.decode(path, "UTF-8");
        } catch (Exception e) {
            logger.error("URL parsing failed: {}", htmlUrl, e);
            throw new RuntimeException("Invalid S3 URL: " + htmlUrl, e);
        }
    }

}