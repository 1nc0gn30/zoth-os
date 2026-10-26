package com.nealfrazier.zothbot;

/** Ink #08080B, gold #D4AF37, bright gold #F6D365, monospace. */
public final class FlipperScreens {
    private static final int W = 15;

    public static final String[] SCENES = {
        "PET", "SIGNAL", "RING", "LOCK", "RELAY", "POCKET"
    };

    private FlipperScreens() {
    }

    public static String[] frame(String scene, int tick) {
        if ("SIGNAL".equals(scene)) return signal(tick);
        if ("RING".equals(scene)) return ring(tick);
        if ("LOCK".equals(scene)) return lock(tick);
        if ("RELAY".equals(scene)) return relay(tick);
        if ("POCKET".equals(scene)) return pocket(tick);
        return pet(tick);
    }

    /** Idle creature. Even tick eyes open, odd tick eyes shut. */
    private static String[] pet(int tick) {
        boolean shut = mod(tick, 2) == 1;
        char eye = shut ? '-' : 'o';
        char[][] g = grid(10);
        center(g[0], "ZOTH  PET  OK");
        put(g[1], 6, '^');
        put(g[1], 8, '^');
        write(g[2], 3, ".-------.");
        put(g[3], 3, '/');
        put(g[3], 5, eye);
        put(g[3], 9, eye);
        put(g[3], 11, '\\');
        put(g[4], 3, '|');
        write(g[4], 6, "\\_/");
        put(g[4], 11, '|');
        put(g[5], 3, '|');
        put(g[5], 7, '.');
        put(g[5], 11, '|');
        write(g[6], 3, "\\_______/");
        put(g[7], 5, '|');
        put(g[7], 9, '|');
        center(g[8], shut ? "shut" : "idle");
        put(g[9], 6, '*');
        put(g[9], 8, '*');
        return pack(g);
    }

    /** Spectrum bars. New row enters at the top and scrolls down. */
    private static String[] signal(int tick) {
        char[][] g = grid(10);
        center(g[0], "ZOTH SIGNAL OK");
        for (int r = 0; r < 8; r++) {
            for (int c = 1; c <= 13; c++) {
                int level = mod(c * 5L + (tick - (long) r) * 3L, 11);
                char mark = ' ';
                if (level >= 8) mark = '#';
                else if (level >= 5) mark = '+';
                else if (level >= 2) mark = '.';
                g[r + 1][c] = mark;
            }
        }
        int sweep = mod(tick, 100);
        center(g[9], "sweep " + (sweep < 10 ? "0" : "") + sweep);
        return pack(g);
    }

    /** Gold bead ring. One notch per tick; tick % 4 closes the loop. */
    private static String[] ring(int tick) {
        int turn = mod(tick, 4);
        String motif = "#o+.";
        char[] bead = new char[12];
        for (int i = 0; i < bead.length; i++) {
            bead[i] = motif.charAt(mod(i - turn, 4));
        }
        char[][] g = grid(10);
        center(g[0], "ZOTH  RING  OK");
        put(g[1], 4, bead[11]);
        put(g[1], 7, bead[0]);
        put(g[1], 10, bead[1]);
        put(g[2], 1, bead[10]);
        put(g[2], 13, bead[2]);
        put(g[3], 0, bead[9]);
        put(g[3], 14, bead[3]);
        center(g[3], "RING");
        put(g[4], 1, bead[8]);
        put(g[4], 7, (char) ('0' + turn));
        put(g[4], 13, bead[4]);
        put(g[5], 4, bead[7]);
        put(g[5], 7, bead[6]);
        put(g[5], 10, bead[5]);
        center(g[6], "notch");
        center(g[7], (turn + 1) + "/4");
        center(g[8], "gold");
        center(g[9], "spin");
        return pack(g);
    }

    /** Closed padlock. Second tick replaces the state line with SEALED. */
    private static String[] lock(int tick) {
        boolean sealed = mod(tick, 2) == 1;
        char[][] g = grid(10);
        center(g[0], "ZOTH  LOCK  OK");
        center(g[1], "[#][=][ok]");
        write(g[2], 5, ".---.");
        write(g[3], 4, "/     \\");
        write(g[4], 3, "|  ###  |");
        write(g[5], 3, "| |   | |");
        write(g[6], 3, "| |___| |");
        write(g[7], 3, "'-------'");
        center(g[8], sealed ? "SEALED" : "CLOSED");
        center(g[9], "hold");
        return pack(g);
    }

    /** Short antenna. Waves pulse, and the packet count steps with tick. */
    private static String[] relay(int tick) {
        boolean pulse = mod(tick, 2) == 0;
        char[][] g = grid(10);
        center(g[0], "ZOTH  RELAY OK");
        put(g[1], 7, '|');
        write(g[2], 6, "/|\\");
        put(g[3], 5, '/');
        put(g[3], 7, '|');
        put(g[3], 9, '\\');
        put(g[4], 4, '/');
        put(g[4], 7, '|');
        put(g[4], 10, '\\');
        write(g[5], 6, "[+]");
        if (pulse) {
            write(g[6], 3, "(((");
            write(g[6], 9, ")))");
        } else {
            write(g[6], 4, "((");
            write(g[6], 9, "))");
        }
        put(g[6], 7, '|');
        put(g[7], 7, '|');
        center(g[8], String.format("pkt %04d", mod(tick, 10000)));
        center(g[9], pulse ? "burst" : "quiet");
        return pack(g);
    }

    /** Folder of three names. Cursor advances with tick % 3. */
    private static String[] pocket(int tick) {
        int cursor = mod(tick, 3);
        String[] names = {"note ", "ring ", "seal "};
        char[][] g = grid(10);
        center(g[0], "ZOTH  POCKET OK");
        write(g[1], 3, ".-------.");
        put(g[2], 3, '|');
        write(g[2], 6, "DIR");
        put(g[2], 11, '|');
        write(g[3], 3, "|-------|");
        for (int i = 0; i < names.length; i++) {
            put(g[4 + i], 3, '|');
            put(g[4 + i], 4, i == cursor ? '>' : ' ');
            write(g[4 + i], 6, names[i]);
            put(g[4 + i], 11, '|');
        }
        write(g[7], 3, "'-------'");
        center(g[8], (cursor + 1) + " of 3");
        center(g[9], "open");
        return pack(g);
    }

    private static int mod(long value, int base) {
        int m = (int) (value % base);
        return m < 0 ? m + base : m;
    }

    private static char[][] grid(int rows) {
        char[][] g = new char[rows][W];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < W; c++) g[r][c] = ' ';
        }
        return g;
    }

    private static void put(char[] line, int col, char c) {
        line[col] = c;
    }

    private static void write(char[] line, int col, String text) {
        for (int i = 0; i < text.length(); i++) line[col + i] = text.charAt(i);
    }

    private static void center(char[] line, String text) {
        write(line, (W - text.length()) / 2, text);
    }

    private static String[] pack(char[][] g) {
        String[] out = new String[g.length];
        for (int i = 0; i < g.length; i++) out[i] = new String(g[i]);
        return out;
    }
}
