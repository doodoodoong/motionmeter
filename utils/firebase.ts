import { initializeApp } from 'firebase/app';
import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore';

// 환경 변수에서 Firebase 설정 로드
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export type WeaponType = 'flail' | 'staff' | 'mace';

export interface MeasurementData {
  weapon: string;
  maxAngularVelocity: number;
  rotationalEnergy: number;
}

/**
 * 측정 결과를 Cloud Firestore에 업로드
 * 경로: measurements/{docId}
 */
export const uploadMeasurementResult = async (
  data: MeasurementData
): Promise<boolean> => {
  try {
    const collectionRef = collection(db, 'measurements');
    
    await addDoc(collectionRef, {
      weapon: data.weapon,
      maxAngularVelocity: data.maxAngularVelocity,
      rotationalEnergy: data.rotationalEnergy,
      timestamp: serverTimestamp(),
    });
    
    console.log(`측정 결과 업로드 성공: ${data.weapon}`);
    return true;
  } catch (error) {
    console.error('Firestore 업로드 오류:', error);
    return false;
  }
};
