package com.nealfrazier.zothbot;

// Round-watch handheld scenes. Original frames, not Nintendo art.
public final class GameboyFrames {
    public static final String[] SCENES = {"BOOT","IDLE","WALK","MENU"};

    private static final String OPEN = "  /  o  o  \\  ";
    private static final String SHUT = "  /  -  -  \\  ";
    private static final String ARMS = "    / || \\    ";
    private static final String STAND = "   |  ||  |   ";
    private static final String FEET = "   '  ''  '   ";
    private static final int WIDE = 14;

    private GameboyFrames() {
    }

    public static String[] frame(String scene, int tick) {
        if ("BOOT".equals(scene)) return boot(step(tick, 4));
        if ("WALK".equals(scene)) return walk(step(tick, 2));
        if ("MENU".equals(scene)) return menu(step(tick, 3));
        return idle(step(tick, 2));
    }

    // Java % keeps the sign; fold negatives back into the cycle.
    private static int step(int tick, int cycle) {
        int n = tick % cycle;
        return n < 0 ? n + cycle : n;
    }

    private static String[] boot(int phase) {
        if (phase == 0) return curtain("[            ]");
        if (phase == 1) return curtain("[######      ]");
        return new String[] {
            "              ",
            "+------------+",
            "|            |",
            "|  ZOTH BOY  |",
            phase == 3 ? "|   PRESS    |" : "|            |",
            "|            |",
            "+------------+",
            "              "
        };
    }

    private static String[] curtain(String bar) {
        String shade = "##############";
        return new String[] {shade, shade, shade, bar, shade, shade, shade, shade};
    }

    private static String[] idle(int phase) {
        return figure(phase == 1 ? SHUT : OPEN, STAND, FEET);
    }

    private static String[] walk(int phase) {
        if (phase == 0) return figure(OPEN, "   /  ||  |   ", "  '   ''      ");
        return figure(OPEN, "   |  ||  \\   ", "      ''   '  ");
    }

    private static String[] figure(String eyes, String legs, String feet) {
        return new String[] {
            "   .------.   ",
            eyes,
            "  |   --   |  ",
            "   \\------/   ",
            "    |ZOTH|    ",
            "     ||||     ",
            ARMS,
            legs,
            feet
        };
    }

    private static String[] menu(int slot) {
        return new String[] {
            ".------------.",
            "|    MENU    |",
            "'------------'",
            row("TALK", slot == 0),
            row("LOCK", slot == 1),
            row("RING", slot == 2),
            "--------------"
        };
    }

    private static String row(String label, boolean cursor) {
        String line = (cursor ? "> " : "  ") + label;
        StringBuilder padded = new StringBuilder(line);
        while (padded.length() < WIDE) padded.append(' ');
        return padded.toString();
    }
}
