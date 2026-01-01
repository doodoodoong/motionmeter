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

export type GradeLevel = 'elementary' | 'secondary';
export type FlailCategory = 'infantry' | 'cavalry';

export interface MeasurementData {
  maxEnergy: number;
  maxAngularVelocity: number;
}

/**
 * 측정 결과를 Cloud Firestore에 업로드
 * 경로: measurements/{gradeLevel}/{flailType}/{docId}
 */
export const uploadMeasurementResult = async (
  gradeLevel: GradeLevel,
  flailType: FlailCategory,
  data: MeasurementData
): Promise<boolean> => {
  try {
    const collectionRef = collection(db, 'measurements', gradeLevel, flailType);
    
    await addDoc(collectionRef, {
      ...data,
      timestamp: serverTimestamp(),
    });
    
    console.log(`측정 결과 업로드 성공: ${gradeLevel}/${flailType}`);
    return true;
  } catch (error) {
    console.error('Firestore 업로드 오류:', error);
    return false;
  }
};

/**
 * 전체 측정 결과 (보병용 + 마상용) 한 번에 업로드
 */
export const uploadFinalResults = async (
  gradeLevel: GradeLevel,
  infantryData: MeasurementData,
  cavalryData: MeasurementData
): Promise<boolean> => {
  try {
    const infantrySuccess = await uploadMeasurementResult(gradeLevel, 'infantry', infantryData);
    const cavalrySuccess = await uploadMeasurementResult(gradeLevel, 'cavalry', cavalryData);
    
    return infantrySuccess && cavalrySuccess;
  } catch (error) {
    console.error('Firestore 업로드 오류:', error);
    return false;
  }
};
