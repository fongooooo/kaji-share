import { arrayUnion, collection, doc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';

import { db } from '@/lib/firebase';

function generateInviteCode() {
  // 紛らわしい文字(0/O, 1/I)を避けた6桁の招待コード
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function createCouple(uid: string) {
  const coupleId = doc(collection(db, 'couples')).id;
  const inviteCode = generateInviteCode();
  await setDoc(doc(db, 'couples', coupleId), {
    memberUids: [uid],
    inviteCode,
  });
  await updateDoc(doc(db, 'users', uid), { coupleId });
  return { coupleId, inviteCode };
}

export async function joinCoupleByInviteCode(uid: string, inviteCode: string) {
  const snapshot = await getDocs(query(collection(db, 'couples'), where('inviteCode', '==', inviteCode.trim().toUpperCase())));
  const coupleDoc = snapshot.docs[0];
  if (!coupleDoc) {
    throw new Error('招待コードが見つかりませんでした');
  }
  await updateDoc(coupleDoc.ref, { memberUids: arrayUnion(uid) });
  await updateDoc(doc(db, 'users', uid), { coupleId: coupleDoc.id });
  return coupleDoc.id;
}

export function subscribeCoupleMemberUids(coupleId: string, onChange: (memberUids: string[]) => void) {
  return onSnapshot(doc(db, 'couples', coupleId), (snapshot) => {
    onChange((snapshot.data()?.memberUids as string[] | undefined) ?? []);
  });
}
