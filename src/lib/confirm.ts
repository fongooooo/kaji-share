import { Alert, Platform } from 'react-native';

// react-native-webのAlert.alertは複数ボタンの確認ダイアログに対応していないため、
// Webではwindow.confirmを、ネイティブ(iOS/Android)ではAlert.alertを使い分ける
export function confirmAsync(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'キャンセル', style: 'cancel', onPress: () => resolve(false) },
      { text: '削除する', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
