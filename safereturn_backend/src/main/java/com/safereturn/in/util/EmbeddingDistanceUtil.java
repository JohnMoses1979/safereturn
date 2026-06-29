package com.safereturn.in.util;

import java.util.List;

import com.safereturn.in.exception.FaceApiException;

public final class EmbeddingDistanceUtil {

    public static final double DISTANCE_THRESHOLD = 0.50;
    private static final int   EMBEDDING_DIM      = 128;

    private EmbeddingDistanceUtil() {}

    public static String toCsv(List<Double> embedding) {
        if (embedding == null || embedding.size() != EMBEDDING_DIM) {
            throw new FaceApiException(
                    "Cannot serialise embedding: expected " + EMBEDDING_DIM
                            + " floats, got "
                            + (embedding == null ? "null" : embedding.size()), 500);
        }
        StringBuilder sb = new StringBuilder(EMBEDDING_DIM * 12);
        for (int i = 0; i < embedding.size(); i++) {
            sb.append(embedding.get(i));
            if (i < embedding.size() - 1) sb.append(',');
        }
        return sb.toString();
    }

    public static double[] fromCsv(String csv) {
        if (csv == null || csv.isBlank()) {
            throw new FaceApiException("Cannot parse embedding: stored value is empty.", 500);
        }
        String[] parts = csv.split(",");
        if (parts.length != EMBEDDING_DIM) {
            throw new FaceApiException(
                    "Cannot parse embedding: expected " + EMBEDDING_DIM
                            + " values, found " + parts.length, 500);
        }
        double[] result = new double[EMBEDDING_DIM];
        for (int i = 0; i < parts.length; i++) {
            result[i] = Double.parseDouble(parts[i].trim());
        }
        return result;
    }

    public static double euclideanDistance(double[] a, double[] b) {
        if (a.length != EMBEDDING_DIM || b.length != EMBEDDING_DIM) {
            throw new IllegalArgumentException(
                    "Both embeddings must be " + EMBEDDING_DIM + "-dimensional.");
        }
        double sum = 0.0;
        for (int i = 0; i < EMBEDDING_DIM; i++) {
            double diff = a[i] - b[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }

    public static double euclideanDistance(String storedCsv, List<Double> queryList) {
        double[] stored = fromCsv(storedCsv);
        double[] query  = queryList.stream().mapToDouble(Double::doubleValue).toArray();
        return euclideanDistance(stored, query);
    }

    public static boolean isMatch(double distance) {
        return distance < DISTANCE_THRESHOLD;
    }
}
