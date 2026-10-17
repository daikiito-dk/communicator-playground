#!/usr/bin/env bash
# Clicks Communicator 相当の AVD（Android エミュレーター）を作成します。
#
# 使い方:
#   ./avd/create-avd.sh             AVD を作成
#   ./avd/create-avd.sh --install   システムイメージが無ければ sdkmanager でインストール
#   ./avd/create-avd.sh --force     同名の AVD があれば上書き
#   ./avd/create-avd.sh --dry-run   SDK に触れず、適用する設定だけ表示
#
# 環境変数で上書きできる値:
#   AVD_NAME     (既定: Clicks_Communicator)
#   API_LEVEL    (既定: 37 = Android 17)
#   IMAGE_TAG    (既定: google_apis_playstore)
#   DENSITY      (既定: 420。実機の `adb shell wm density` に合わせて変更)
#   BASE_DEVICE  (既定: pixel_5。画面とキーボード設定は後から上書きします)
#   RAM_MB       (既定: 4096。ホスト PC の負荷を抑えるため実機の 12GB より小さくしています)
set -euo pipefail

AVD_NAME="${AVD_NAME:-Clicks_Communicator}"
API_LEVEL="${API_LEVEL:-37}"
IMAGE_TAG="${IMAGE_TAG:-google_apis_playstore}"
DENSITY="${DENSITY:-420}"
BASE_DEVICE="${BASE_DEVICE:-pixel_5}"
RAM_MB="${RAM_MB:-4096}"
SKIN_NAME="clicks_communicator"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
kit_dir="$(dirname "$script_dir")"
skin_src="$kit_dir/skin/$SKIN_NAME"

install_image=false
force=false
dry_run=false
for arg in "$@"; do
  case "$arg" in
    --install) install_image=true ;;
    --force) force=true ;;
    --dry-run) dry_run=true ;;
    -h|--help) sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "不明なオプション: $arg" >&2; exit 2 ;;
  esac
done

case "$(uname -m)" in
  arm64|aarch64) abi="arm64-v8a" ;;
  *) abi="x86_64" ;;
esac
image_pkg="system-images;android-${API_LEVEL};${IMAGE_TAG};${abi}"

find_sdk() {
  local candidate
  for candidate in "${ANDROID_HOME:-}" "${ANDROID_SDK_ROOT:-}" \
    "$HOME/Library/Android/sdk" "$HOME/Android/Sdk"; do
    if [[ -n "$candidate" && -d "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

find_tool() {
  local sdk="$1" name="$2" path
  for path in "$sdk/cmdline-tools/latest/bin/$name" "$sdk/tools/bin/$name"; do
    [[ -x "$path" ]] && { echo "$path"; return 0; }
  done
  command -v "$name" 2>/dev/null
}

overrides() {
  local skin_path="$1"
  cat <<EOF
avd.ini.displayname=Clicks Communicator (Community)
hw.lcd.width=1080
hw.lcd.height=1200
hw.lcd.density=${DENSITY}
hw.keyboard=yes
hw.keyboard.lid=no
hw.mainKeys=no
hw.dPad=no
hw.trackBall=no
hw.initialOrientation=portrait
hw.camera.back=emulated
hw.camera.front=emulated
hw.ramSize=${RAM_MB}
skin.name=${SKIN_NAME}
skin.path=${skin_path}
skin.dynamic=no
showDeviceFrame=yes
EOF
}

# config.ini の key を置き換え、無ければ追記します（"key=value" と "key = value" の両方に対応）。
set_kv() {
  local file="$1" key="$2" value="$3" tmp
  tmp="$(mktemp)"
  awk -v k="$key" -v v="$value" '
    BEGIN { done = 0 }
    {
      split($0, parts, "=")
      name = parts[1]
      gsub(/^[ \t]+|[ \t]+$/, "", name)
      if (name == k) { print k "=" v; done = 1; next }
      print
    }
    END { if (!done) print k "=" v }
  ' "$file" > "$tmp"
  mv "$tmp" "$file"
}

if $dry_run; then
  echo "# AVD 名: $AVD_NAME"
  echo "# システムイメージ: $image_pkg"
  echo "# ベース端末: $BASE_DEVICE"
  overrides "<SDK>/skins/$SKIN_NAME"
  exit 0
fi

if [[ ! -f "$skin_src/layout" ]]; then
  echo "スキンが見つかりません: $skin_src" >&2
  echo "先に python3 tools/generate_skin.py を実行してください。" >&2
  exit 1
fi

if ! sdk="$(find_sdk)"; then
  echo "Android SDK が見つかりません。Android Studio をインストールするか、ANDROID_HOME を設定してください。" >&2
  exit 1
fi

avdmanager="$(find_tool "$sdk" avdmanager || true)"
sdkmanager="$(find_tool "$sdk" sdkmanager || true)"
if [[ -z "$avdmanager" ]]; then
  echo "avdmanager が見つかりません。Android Studio の SDK Manager で「Android SDK Command-line Tools」を入れてください。" >&2
  exit 1
fi

image_dir="$sdk/system-images/android-${API_LEVEL}/${IMAGE_TAG}/${abi}"
if [[ ! -d "$image_dir" ]]; then
  if $install_image && [[ -n "$sdkmanager" ]]; then
    "$sdkmanager" "$image_pkg"
  else
    echo "システムイメージがありません: $image_pkg" >&2
    echo "--install を付けて再実行するか、次のコマンドでインストールしてください:" >&2
    echo "  sdkmanager \"$image_pkg\"" >&2
    exit 1
  fi
fi

# エミュレーターは空白を含むパスのスキンを読めない場合があるため、SDK 配下にコピーして参照します。
skin_dest="$sdk/skins/$SKIN_NAME"
mkdir -p "$skin_dest"
cp "$skin_src/layout" "$skin_src/frame.png" "$skin_src/mask.png" "$skin_dest/"

create_args=(create avd -n "$AVD_NAME" -k "$image_pkg" -d "$BASE_DEVICE")
$force && create_args+=(--force)
echo "no" | "$avdmanager" "${create_args[@]}"

avd_home="${ANDROID_AVD_HOME:-$HOME/.android/avd}"
config="$avd_home/$AVD_NAME.avd/config.ini"
if [[ ! -f "$config" ]]; then
  echo "config.ini が見つかりません: $config" >&2
  exit 1
fi

while IFS='=' read -r key value; do
  [[ -z "$key" ]] && continue
  set_kv "$config" "$key" "$value"
done < <(overrides "$skin_dest")

echo
echo "AVD を作成しました: $AVD_NAME"
echo "起動: \"$sdk/emulator/emulator\" -avd $AVD_NAME"
