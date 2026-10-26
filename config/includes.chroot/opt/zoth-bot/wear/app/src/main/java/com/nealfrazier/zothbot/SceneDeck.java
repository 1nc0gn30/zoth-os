package com.nealfrazier.zothbot;

public final class SceneDeck {
    public static final int FLIPPER = 0;
    public static final int GAMEBOY = 1;

    private SceneDeck() {
    }

    public static String[] frame(int deck, int sceneIndex, int tick) {
        String name = sceneName(deck, sceneIndex);
        if (deck == GAMEBOY) return GameboyFrames.frame(name, tick);
        return FlipperScreens.frame(name, tick);
    }

    public static int sceneCount(int deck) {
        return scenes(deck).length;
    }

    public static String sceneName(int deck, int sceneIndex) {
        String[] names = scenes(deck);
        return names[Math.floorMod(sceneIndex, names.length)];
    }

    private static String[] scenes(int deck) {
        if (deck == GAMEBOY) return GameboyFrames.SCENES;
        return FlipperScreens.SCENES;
    }
}
