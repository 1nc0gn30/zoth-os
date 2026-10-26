package com.nealfrazier.zothbot;

import android.Manifest;
import android.animation.ValueAnimator;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Canvas;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.MediaPlayer;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Base64;
import android.view.Gravity;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final String HOST = "http://10.130.242.15:9340";
    private static final String SAY = HOST + "/api/watch/say";
    private static final String SNAP = HOST + "/api/watch/snapshot";
    private static final String CMD = HOST + "/api/watch/command";
    private static final int GOLD = 0xFFD4AF37;
    private static final int GOLD_BRIGHT = 0xFFF6D365;
    private static final int INK = 0xFF08080B;
    private static final int PAGE_HOME = 0;
    private static final int PAGE_MENU = 1;
    private static final int PAGE_DETAIL = 2;
    private static final int PAGE_SCENES = 3;

    private static final String[][] FALLBACK_MENU = {
        {"talk", "TALK", "Live conversation"},
        {"faces", "FACES", "Flipper and Game Boy screens"},
        {"status", "STATUS", "Ports, ring, vitals"},
        {"ring", "RING", "Authority now"},
        {"lock", "LOCK", "zoth-lock"},
        {"models", "MODELS", "Ollama roster"},
        {"mcp", "MCP", "Tool servers"},
        {"pocket", "POCKET", "Workspace files"},
        {"os", "OS", "zoth-agent-os"},
        {"screen", "SCREEN", "Capture desktop"},
        {"skills", "SKILLS", "Pocket skills"},
        {"memory", "MEMORY", "Teammate memory"},
        {"ring0", "RING 0", "Sovereign"},
        {"ring2", "RING 2", "Toolmaster"},
    };

    private FrameLayout homePage;
    private LinearLayout menuPage;
    private LinearLayout detailPage;
    private FrameLayout scenePage;
    private SceneStage stage;
    private int sceneDeck = SceneDeck.FLIPPER;
    private int sceneIndex;
    private TextView eyebrow;
    private TextView line;
    private TextView menuHint;
    private TextView detailTitle;
    private TextView detailBody;
    private ScrollView detailScroll;
    private Button talk;
    private AsciiZoth zoth;
    private TextToSpeech tts;
    private MediaPlayer player;
    private SpeechRecognizer ear;
    private final JSONArray turns = new JSONArray();
    private final ArrayList<String[]> menu = new ArrayList<>();
    private boolean busy;
    private boolean live;
    private int misses;
    private int page = PAGE_HOME;
    private int menuIndex;
    private String ringLabel = "RING · ZOTH OS";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        for (String[] row : FALLBACK_MENU) menu.add(row);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(INK);
        root.setFocusable(true);
        root.setFocusableInTouchMode(true);
        root.requestFocus();

        homePage = buildHome();
        menuPage = buildMenu();
        detailPage = buildDetail();
        scenePage = buildScenes();
        root.addView(homePage, match());
        root.addView(menuPage, match());
        root.addView(detailPage, match());
        root.addView(scenePage, match());
        setContentView(root);
        show(PAGE_HOME);

        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) tts.setLanguage(Locale.US);
        });
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) {}
            @Override public void onDone(String id) { runOnUiThread(() -> afterSpeech()); }
            @Override public void onError(String id) { runOnUiThread(() -> afterSpeech()); }
        });
        if (SpeechRecognizer.isRecognitionAvailable(this)) {
            ear = SpeechRecognizer.createSpeechRecognizer(this);
            ear.setRecognitionListener(new Ear());
        }
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, 1);
        }
        refreshSnapshot();
    }

    private FrameLayout buildHome() {
        FrameLayout layer = new FrameLayout(this);
        layer.addView(new RingView(this), match());

        eyebrow = label("ZOTH OS", 10);
        eyebrow.setLetterSpacing(0.28f);
        FrameLayout.LayoutParams eyeLp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.TOP
        );
        eyeLp.topMargin = dp(16);
        layer.addView(eyebrow, eyeLp);

        zoth = new AsciiZoth(this);
        zoth.setOnClickListener(v -> {
            if (this.page == PAGE_HOME) toggle();
        });
        FrameLayout.LayoutParams zothLp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT
        );
        zothLp.topMargin = dp(28);
        zothLp.bottomMargin = dp(72);
        layer.addView(zoth, zothLp);

        line = body("Bezel for menu · tap to talk", 12);
        FrameLayout.LayoutParams lineLp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM
        );
        lineLp.bottomMargin = dp(50);
        lineLp.leftMargin = dp(28);
        lineLp.rightMargin = dp(28);
        layer.addView(line, lineLp);

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER);
        talk = chip("SPEAK");
        talk.setOnClickListener(v -> toggle());
        Button menuBtn = chip("MENU");
        menuBtn.setOnClickListener(v -> {
            stopLoop();
            show(PAGE_MENU);
        });
        bar.addView(talk);
        bar.addView(spacer(8));
        bar.addView(menuBtn);
        FrameLayout.LayoutParams barLp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT, dp(36), Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL
        );
        barLp.bottomMargin = dp(10);
        layer.addView(bar, barLp);
        return layer;
    }

    private LinearLayout buildMenu() {
        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setGravity(Gravity.CENTER);
        page.setPadding(dp(18), dp(18), dp(18), dp(18));
        TextView head = label("COMMANDS", 10);
        head.setLetterSpacing(0.28f);
        page.addView(head);
        menuHint = body("", 13);
        menuHint.setTextSize(16);
        menuHint.setPadding(0, dp(10), 0, dp(4));
        page.addView(menuHint);
        TextView sub = body("rotate bezel · tap to run", 10);
        sub.setTextColor(0x99F5E6AB);
        page.addView(sub);
        page.setOnClickListener(v -> runMenu());
        renderMenu();
        return page;
    }

    private LinearLayout buildDetail() {
        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setPadding(dp(16), dp(18), dp(16), dp(12));
        detailTitle = label("ZOTH", 10);
        detailTitle.setLetterSpacing(0.22f);
        page.addView(detailTitle);
        detailScroll = new ScrollView(this);
        detailBody = body("", 13);
        detailBody.setGravity(Gravity.START);
        detailBody.setPadding(0, dp(8), 0, dp(8));
        detailScroll.addView(detailBody);
        LinearLayout.LayoutParams scrollLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1
        );
        page.addView(detailScroll, scrollLp);
        Button back = chip("BACK");
        back.setOnClickListener(v -> show(PAGE_MENU));
        LinearLayout.LayoutParams backLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, dp(34)
        );
        backLp.gravity = Gravity.CENTER_HORIZONTAL;
        backLp.topMargin = dp(6);
        page.addView(back, backLp);
        return page;
    }

    private FrameLayout buildScenes() {
        FrameLayout layer = new FrameLayout(this);
        stage = new SceneStage(this);
        stage.setOnClickListener(v -> {
            sceneDeck = sceneDeck == SceneDeck.FLIPPER ? SceneDeck.GAMEBOY : SceneDeck.FLIPPER;
            sceneIndex = 0;
            stage.setDeck(sceneDeck, sceneIndex);
        });
        layer.addView(stage, match());
        Button back = chip("BACK");
        back.setOnClickListener(v -> show(PAGE_MENU));
        FrameLayout.LayoutParams backLp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT, dp(34), Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL
        );
        backLp.bottomMargin = dp(8);
        layer.addView(back, backLp);
        return layer;
    }

    private void show(int next) {
        page = next;
        homePage.setVisibility(next == PAGE_HOME ? View.VISIBLE : View.GONE);
        menuPage.setVisibility(next == PAGE_MENU ? View.VISIBLE : View.GONE);
        detailPage.setVisibility(next == PAGE_DETAIL ? View.VISIBLE : View.GONE);
        scenePage.setVisibility(next == PAGE_SCENES ? View.VISIBLE : View.GONE);
        if (next == PAGE_MENU) renderMenu();
        if (next == PAGE_SCENES) stage.setDeck(sceneDeck, sceneIndex);
    }

    private void renderMenu() {
        if (menu.isEmpty()) return;
        menuIndex = ((menuIndex % menu.size()) + menu.size()) % menu.size();
        String[] cur = menu.get(menuIndex);
        String prev = menu.get((menuIndex - 1 + menu.size()) % menu.size())[1];
        String nxt = menu.get((menuIndex + 1) % menu.size())[1];
        menuHint.setText(prev + "\n▸ " + cur[1] + "\n" + nxt + "\n\n" + cur[2]);
    }

    private void rotate(int dir) {
        if (page == PAGE_HOME) {
            stopLoop();
            show(PAGE_MENU);
            return;
        }
        if (page == PAGE_MENU) {
            menuIndex += dir;
            renderMenu();
            return;
        }
        if (page == PAGE_DETAIL) {
            detailScroll.smoothScrollBy(0, dir * dp(28));
            return;
        }
        if (page == PAGE_SCENES) {
            sceneIndex += dir;
            stage.setDeck(sceneDeck, sceneIndex);
        }
    }

    @Override
    public boolean onGenericMotionEvent(MotionEvent event) {
        if (event.getAction() == MotionEvent.ACTION_SCROLL
            && (event.getSource() & InputDevice.SOURCE_ROTARY_ENCODER) != 0) {
            float v = event.getAxisValue(MotionEvent.AXIS_SCROLL);
            if (v > 0.02f) rotate(-1);
            else if (v < -0.02f) rotate(1);
            return true;
        }
        return super.onGenericMotionEvent(event);
    }

    private void runMenu() {
        if (menu.isEmpty()) return;
        String id = menu.get(menuIndex)[0];
        if ("talk".equals(id)) {
            show(PAGE_HOME);
            startLoop();
            return;
        }
        if ("faces".equals(id)) {
            stopLoop();
            show(PAGE_SCENES);
            return;
        }
        detailTitle.setText(menu.get(menuIndex)[1]);
        detailBody.setText("…");
        show(PAGE_DETAIL);
        new Thread(() -> {
            Spoken spoken;
            try {
                spoken = postCommand(id);
            } catch (Exception err) {
                spoken = new Spoken("Zoth is not on this network", null);
            }
            Spoken out = spoken;
            runOnUiThread(() -> {
                detailTitle.setText(out.title == null || out.title.isEmpty() ? "ZOTH" : out.title);
                detailBody.setText(out.text);
                zoth.setMood(AsciiZoth.SPEAK);
                speakOut(out);
            });
        }).start();
    }

    private void refreshSnapshot() {
        new Thread(() -> {
            try {
                JSONObject obj = getJson(SNAP);
                JSONObject ring = obj.optJSONObject("ring");
                JSONObject bot = obj.optJSONObject("bot");
                final String chip;
                if (ring != null) {
                    chip = "RING " + ring.optInt("ring") + " · " + ring.optString("name", "ZOTH");
                } else {
                    chip = "ZOTH OS";
                }
                JSONArray items = obj.optJSONArray("menu");
                final ArrayList<String[]> next = new ArrayList<>();
                if (items != null) {
                    for (int i = 0; i < items.length(); i++) {
                        JSONObject it = items.getJSONObject(i);
                        next.add(new String[]{
                            it.optString("id"),
                            it.optString("label"),
                            it.optString("hint")
                        });
                    }
                }
                final String botName = bot != null ? bot.optString("name", "Zoth") : "Zoth";
                runOnUiThread(() -> {
                    ringLabel = chip;
                    eyebrow.setText(chip);
                    if (!next.isEmpty()) {
                        menu.clear();
                        menu.addAll(next);
                        boolean hasFaces = false;
                        for (String[] row : menu) {
                            if ("faces".equals(row[0])) hasFaces = true;
                        }
                        if (!hasFaces) {
                            menu.add(new String[]{"faces", "FACES", "Flipper and Game Boy screens"});
                        }
                        renderMenu();
                    }
                    if (page == PAGE_HOME && !live && !busy) {
                        line.setText(botName + " · bezel for menu");
                    }
                });
            } catch (Exception ignored) {
                /* stay on fallback menu */
            }
        }).start();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (results.length == 0 || results[0] != PackageManager.PERMISSION_GRANTED) {
            line.setText("Allow the mic");
        }
    }

    private FrameLayout.LayoutParams match() {
        return new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        );
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private TextView label(String text, int size) {
        TextView v = new TextView(this);
        v.setText(text);
        v.setTextColor(GOLD);
        v.setGravity(Gravity.CENTER);
        v.setTextSize(size);
        v.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        v.setAllCaps(true);
        return v;
    }

    private TextView body(String text, int size) {
        TextView v = new TextView(this);
        v.setText(text);
        v.setTextColor(0xFFF5E6AB);
        v.setGravity(Gravity.CENTER);
        v.setTextSize(size);
        v.setMaxLines(12);
        return v;
    }

    private Button chip(String text) {
        Button b = new Button(this);
        b.setText(text);
        b.setAllCaps(true);
        b.setTextColor(GOLD_BRIGHT);
        b.setTextSize(10);
        b.setLetterSpacing(0.16f);
        b.setMinWidth(dp(72));
        b.setMinHeight(dp(32));
        b.setPadding(dp(12), 0, dp(12), 0);
        GradientDrawable chip = new GradientDrawable();
        chip.setColor(0xCC08080B);
        chip.setCornerRadius(dp(18));
        chip.setStroke(dp(1), GOLD);
        b.setBackground(chip);
        return b;
    }

    private View spacer(int dps) {
        View v = new View(this);
        v.setLayoutParams(new LinearLayout.LayoutParams(dp(dps), dp(1)));
        return v;
    }

    private void toggle() {
        if (live) stopLoop();
        else startLoop();
    }

    private void startLoop() {
        if (ear == null) {
            line.setText("Mic is not available");
            return;
        }
        live = true;
        misses = 0;
        talk.setText("STOP");
        listen();
    }

    private void stopLoop() {
        live = false;
        busy = false;
        talk.setEnabled(true);
        talk.setText("SPEAK");
        if (ear != null) {
            try { ear.stopListening(); } catch (Exception ignored) {}
        }
        if (tts != null) tts.stop();
        stopPlayer();
        zoth.setMood(AsciiZoth.IDLE);
        if (page == PAGE_HOME) line.setText(ringLabel);
    }

    private void afterSpeech() {
        if (page != PAGE_HOME) {
            zoth.setMood(AsciiZoth.IDLE);
            return;
        }
        if (live) listen();
        else zoth.setMood(AsciiZoth.IDLE);
    }

    private void listen() {
        if (!live || busy || ear == null || page != PAGE_HOME) return;
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 1400L);
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 900L);
        zoth.setMood(AsciiZoth.LISTEN);
        line.setText("Listening");
        try {
            ear.startListening(intent);
        } catch (Exception err) {
            line.setText("Mic is not available");
            stopLoop();
        }
    }

    private void ask(String text) {
        busy = true;
        talk.setEnabled(false);
        zoth.setMood(AsciiZoth.THINK);
        line.setText("…");
        JSONArray prior;
        try {
            prior = new JSONArray(turns.toString());
            remember("user", text);
        } catch (Exception err) {
            prior = new JSONArray();
        }
        JSONArray sent = prior;
        new Thread(() -> {
            Spoken spoken;
            boolean offline = false;
            try {
                spoken = postSay(text, sent);
            } catch (Exception err) {
                spoken = new Spoken("Zoth is not on this network", null);
                offline = true;
            }
            Spoken shown = spoken;
            boolean down = offline;
            runOnUiThread(() -> {
                busy = false;
                talk.setEnabled(true);
                line.setText(shown.text);
                if (down || !live) {
                    stopLoop();
                    line.setText(shown.text);
                    return;
                }
                try { remember("assistant", shown.text); } catch (Exception ignored) {}
                zoth.setMood(AsciiZoth.SPEAK);
                speakOut(shown);
            });
        }).start();
    }

    private void remember(String role, String content) throws Exception {
        JSONObject turn = new JSONObject();
        turn.put("role", role);
        turn.put("content", content);
        turns.put(turn);
        while (turns.length() > 8) turns.remove(0);
    }

    private static final class Spoken {
        final String title;
        final String text;
        final byte[] wav;
        Spoken(String text, byte[] wav) {
            this.title = "";
            this.text = text;
            this.wav = wav;
        }
        Spoken(String title, String text, byte[] wav) {
            this.title = title;
            this.text = text;
            this.wav = wav;
        }
    }

    private void speakOut(Spoken spoken) {
        if (spoken.wav != null && spoken.wav.length > 200) {
            if (playWav(spoken.wav)) return;
        }
        if (tts != null && spoken.text != null && !spoken.text.isEmpty()) {
            tts.speak(spoken.text, TextToSpeech.QUEUE_FLUSH, null, "zoth");
            return;
        }
        if (page == PAGE_HOME) listen();
    }

    private boolean playWav(byte[] wav) {
        try {
            File file = new File(getCacheDir(), "zoth.wav");
            try (FileOutputStream out = new FileOutputStream(file)) {
                out.write(wav);
            }
            stopPlayer();
            player = new MediaPlayer();
            player.setDataSource(file.getAbsolutePath());
            player.setOnCompletionListener(mp -> afterSpeech());
            player.setOnErrorListener((mp, what, extra) -> {
                afterSpeech();
                return true;
            });
            player.prepare();
            player.start();
            return true;
        } catch (Exception err) {
            return false;
        }
    }

    private void stopPlayer() {
        if (player == null) return;
        try { player.stop(); } catch (Exception ignored) {}
        try { player.release(); } catch (Exception ignored) {}
        player = null;
    }

    private JSONObject getJson(String url) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setConnectTimeout(8000);
        conn.setReadTimeout(20000);
        conn.setRequestMethod("GET");
        InputStream in = conn.getResponseCode() < 400 ? conn.getInputStream() : conn.getErrorStream();
        return new JSONObject(readAll(in));
    }

    private Spoken postSay(String text, JSONArray history) throws Exception {
        JSONObject body = new JSONObject();
        body.put("text", text);
        body.put("history", history);
        JSONObject obj = postJson(SAY, body, 120000);
        String reply = obj.optString("text", "…");
        return new Spoken(reply, decodeAudio(obj));
    }

    private Spoken postCommand(String id) throws Exception {
        JSONObject body = new JSONObject();
        body.put("id", id);
        JSONObject obj = postJson(CMD, body, 30000);
        return new Spoken(obj.optString("title", "ZOTH"), obj.optString("text", "…"), decodeAudio(obj));
    }

    private JSONObject postJson(String url, JSONObject body, int readMs) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setConnectTimeout(8000);
        conn.setReadTimeout(readMs);
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
        conn.setDoOutput(true);
        try (OutputStream out = conn.getOutputStream()) {
            out.write(body.toString().getBytes(StandardCharsets.UTF_8));
        }
        InputStream in = conn.getResponseCode() < 400 ? conn.getInputStream() : conn.getErrorStream();
        JSONObject obj = new JSONObject(readAll(in));
        if (conn.getResponseCode() >= 400) {
            throw new Exception(obj.optString("error", "No answer"));
        }
        return obj;
    }

    private byte[] decodeAudio(JSONObject obj) {
        String audio = obj.optString("audio", "");
        if (audio.isEmpty()) return null;
        return Base64.decode(audio, Base64.DEFAULT);
    }

    private String readAll(InputStream in) throws Exception {
        ByteArrayOutputStream buf = new ByteArrayOutputStream();
        byte[] tmp = new byte[4096];
        int n;
        while (in != null && (n = in.read(tmp)) >= 0) buf.write(tmp, 0, n);
        return buf.toString(StandardCharsets.UTF_8);
    }

    @Override
    protected void onPause() {
        if (ear != null) {
            try { ear.stopListening(); } catch (Exception ignored) {}
        }
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        refreshSnapshot();
        if (page != PAGE_HOME) return;
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) return;
        if (!live && !busy) startLoop();
        else if (live && !busy) listen();
    }

    @Override
    public void onBackPressed() {
        if (page == PAGE_DETAIL || page == PAGE_SCENES) {
            show(PAGE_MENU);
            return;
        }
        if (page == PAGE_MENU) {
            show(PAGE_HOME);
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        live = false;
        stopPlayer();
        if (ear != null) ear.destroy();
        if (tts != null) tts.shutdown();
        super.onDestroy();
    }

    private final class Ear implements RecognitionListener {
        @Override public void onReadyForSpeech(Bundle params) {}
        @Override public void onBeginningOfSpeech() {}
        @Override public void onRmsChanged(float rmsdB) {}
        @Override public void onBufferReceived(byte[] buffer) {}
        @Override public void onEndOfSpeech() {}
        @Override public void onEvent(int eventType, Bundle params) {}

        @Override
        public void onPartialResults(Bundle partial) {
            if (!live || busy || page != PAGE_HOME) return;
            ArrayList<String> words = partial.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (words != null && !words.isEmpty() && !words.get(0).trim().isEmpty()) {
                line.setText(words.get(0));
            }
        }

        @Override
        public void onResults(Bundle results) {
            if (!live || busy || page != PAGE_HOME) return;
            ArrayList<String> words = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (words == null || words.isEmpty() || words.get(0).trim().isEmpty()) {
                listen();
                return;
            }
            misses = 0;
            ask(words.get(0).trim());
        }

        @Override
        public void onError(int error) {
            if (!live || busy || page != PAGE_HOME) return;
            if (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) {
                stopLoop();
                line.setText("Allow the mic");
                return;
            }
            misses++;
            if (misses > 8) {
                stopLoop();
                line.setText("Tap Zoth");
                return;
            }
            int wait = error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY ? 700 : 350;
            line.postDelayed(() -> {
                if (live && !busy && page == PAGE_HOME) listen();
            }, wait);
        }
    }

    static final class AsciiZoth extends View {
        static final int IDLE = 0;
        static final int LISTEN = 1;
        static final int THINK = 2;
        static final int SPEAK = 3;

        private static final String[] MARK = {
            " _____  ___   _____  _   _ ",
            "|__  / / _ \\ |_   _|| | | |",
            "  / / | | | |  | |  | |_| |",
            " / /_ | |_| |  | |  |  _  |",
            "/____| \\___/   |_|  |_| |_|"
        };

        private final Paint ink = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint glow = new Paint(Paint.ANTI_ALIAS_FLAG);
        private int mood = IDLE;
        private float clock;
        private boolean down;

        AsciiZoth(android.content.Context context) {
            super(context);
            Typeface mono = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD);
            ink.setTypeface(mono);
            ink.setColor(GOLD_BRIGHT);
            ink.setTextAlign(Paint.Align.CENTER);
            glow.setTypeface(mono);
            glow.setColor(0x66D4AF37);
            glow.setTextAlign(Paint.Align.CENTER);
            ValueAnimator tick = ValueAnimator.ofFloat(0f, 1f);
            tick.setDuration(1000);
            tick.setRepeatCount(ValueAnimator.INFINITE);
            tick.addUpdateListener(a -> {
                clock += 0.08f;
                invalidate();
            });
            tick.start();
            setClickable(true);
        }

        void setMood(int next) {
            mood = next;
            invalidate();
        }

        @Override
        public boolean onTouchEvent(MotionEvent event) {
            if (event.getAction() == MotionEvent.ACTION_DOWN) down = true;
            if (event.getAction() == MotionEvent.ACTION_UP || event.getAction() == MotionEvent.ACTION_CANCEL) down = false;
            invalidate();
            return super.onTouchEvent(event);
        }

        @Override
        protected void onDraw(Canvas canvas) {
            float size = Math.min(getWidth(), getHeight()) / 32f;
            ink.setTextSize(size);
            glow.setTextSize(size);
            float lineH = ink.getFontSpacing() * 0.92f;
            float block = lineH * MARK.length;
            float y = (getHeight() - block) / 2f - lineH * 0.4f;
            y += (float) Math.sin(clock) * size * (mood == IDLE ? 0.12f : 0.04f);
            if (down) y += size * 0.12f;
            float x = getWidth() / 2f;
            for (int i = 0; i < MARK.length; i++) {
                float rowY = y + i * lineH;
                canvas.drawText(MARK[i], x + 1.5f, rowY + 1.5f, glow);
                canvas.drawText(MARK[i], x, rowY, ink);
            }
        }
    }

    private static final class SceneStage extends View {
        private final Paint ink = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint dim = new Paint(Paint.ANTI_ALIAS_FLAG);
        private int deck = SceneDeck.FLIPPER;
        private int scene;
        private int tick;
        private String[] lines = new String[0];

        SceneStage(android.content.Context context) {
            super(context);
            Typeface mono = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD);
            ink.setTypeface(mono);
            ink.setColor(GOLD_BRIGHT);
            ink.setTextAlign(Paint.Align.CENTER);
            dim.setTypeface(mono);
            dim.setColor(0x99F6D365);
            dim.setTextAlign(Paint.Align.CENTER);
            ValueAnimator tickAnim = ValueAnimator.ofFloat(0f, 1f);
            tickAnim.setDuration(360);
            tickAnim.setRepeatCount(ValueAnimator.INFINITE);
            tickAnim.addUpdateListener(a -> {
                tick++;
                lines = SceneDeck.frame(deck, scene, tick);
                invalidate();
            });
            tickAnim.start();
            setClickable(true);
        }

        void setDeck(int nextDeck, int nextScene) {
            deck = nextDeck;
            scene = nextScene;
            lines = SceneDeck.frame(deck, scene, tick);
            invalidate();
        }

        @Override
        protected void onDraw(Canvas canvas) {
            if (lines == null || lines.length == 0) return;
            float size = Math.min(getWidth(), getHeight()) / 28f;
            ink.setTextSize(size);
            dim.setTextSize(size * 0.72f);
            String deckName = deck == SceneDeck.GAMEBOY ? "GAME BOY" : "FLIPPER";
            String caption = deckName + "  " + SceneDeck.sceneName(deck, scene);
            canvas.drawText(caption, getWidth() / 2f, contextDp() + size, dim);
            float lineH = ink.getFontSpacing() * 0.92f;
            float block = lineH * lines.length;
            float y = (getHeight() - block) / 2f;
            float x = getWidth() / 2f;
            for (int i = 0; i < lines.length; i++) {
                canvas.drawText(lines[i], x, y + i * lineH, ink);
            }
            canvas.drawText("tap deck  ·  bezel scene", getWidth() / 2f, getHeight() - size, dim);
        }

        private float contextDp() {
            return 18f * getResources().getDisplayMetrics().density;
        }
    }

    private static final class RingView extends View {
        private final Paint outer = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint inner = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint core = new Paint(Paint.ANTI_ALIAS_FLAG);
        private float turn;

        RingView(android.content.Context context) {
            super(context);
            outer.setStyle(Paint.Style.STROKE);
            outer.setStrokeWidth(3f);
            outer.setColor(GOLD);
            outer.setPathEffect(new DashPathEffect(new float[]{10f, 14f}, 0f));
            inner.setStyle(Paint.Style.STROKE);
            inner.setStrokeWidth(1.5f);
            inner.setColor(0x88F6D365);
            inner.setPathEffect(new DashPathEffect(new float[]{28f, 16f, 6f, 16f}, 0f));
            core.setStyle(Paint.Style.STROKE);
            core.setStrokeWidth(1f);
            core.setColor(0x44D4AF37);
            ValueAnimator spin = ValueAnimator.ofFloat(0f, 360f);
            spin.setDuration(28000);
            spin.setRepeatCount(ValueAnimator.INFINITE);
            spin.addUpdateListener(a -> {
                turn = (float) a.getAnimatedValue();
                invalidate();
            });
            spin.start();
        }

        @Override
        protected void onDraw(Canvas canvas) {
            float cx = getWidth() / 2f;
            float cy = getHeight() / 2f;
            float radius = Math.min(cx, cy) - 10f;
            canvas.drawCircle(cx, cy, radius * 0.42f, core);
            canvas.save();
            canvas.rotate(turn, cx, cy);
            canvas.drawCircle(cx, cy, radius, outer);
            canvas.restore();
            canvas.save();
            canvas.rotate(-turn * 0.65f, cx, cy);
            canvas.drawCircle(cx, cy, radius * 0.90f, inner);
            canvas.restore();
        }
    }
}
