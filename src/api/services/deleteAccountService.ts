import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from 'firebase/auth';
import {
  doc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

export type DeleteAccountRole = 'student' | 'instructor' | 'school';

/**
 * Re-authenticate the current user with their password, then delete:
 *  - student : users/{uid}
 *  - instructor: users/{uid} + instructors/{uid}
 *  - school  : users/{uid} + schools/{schoolId}
 *
 * Firebase Auth user is always deleted last so Firestore operations
 * can still use the authenticated session.
 */
export async function deleteAccount(
  role: DeleteAccountRole,
  password: string,
  extra?: { schoolId?: string }
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Oturum açmış kullanıcı bulunamadı.');

  // 1. Re-authenticate
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);

  const uid = user.uid;
  const batch = writeBatch(db);

  // 2. Role-specific Firestore cleanup
  if (role === 'student') {
    // Remove user doc
    batch.delete(doc(db, 'users', uid));

    // Detach from courses (remove uid from studentIds arrays)
    const coursesSnap = await getDocs(
      query(collection(db, 'courses'), where('studentIds', 'array-contains', uid))
    );
    coursesSnap.forEach((courseDoc) => {
      const studentIds: string[] = courseDoc.data().studentIds ?? [];
      batch.update(courseDoc.ref, {
        studentIds: studentIds.filter((id) => id !== uid),
        currentParticipants: Math.max(0, (courseDoc.data().currentParticipants ?? 1) - 1),
      });
    });
  } else if (role === 'instructor') {
    // Remove instructor doc (may live in both 'instructors' and 'users')
    batch.delete(doc(db, 'users', uid));

    // Try to remove from instructors collection
    const instrSnap = await getDocs(
      query(collection(db, 'instructors'), where('userId', '==', uid))
    );
    instrSnap.forEach((d) => batch.delete(d.ref));

    // Detach from courses (remove uid from instructorIds arrays)
    const coursesSnap = await getDocs(
      query(collection(db, 'courses'), where('instructorIds', 'array-contains', uid))
    );
    coursesSnap.forEach((courseDoc) => {
      const instructorIds: string[] = courseDoc.data().instructorIds ?? [];
      batch.update(courseDoc.ref, {
        instructorIds: instructorIds.filter((id) => id !== uid),
      });
    });
  } else if (role === 'school') {
    batch.delete(doc(db, 'users', uid));

    // Delete the school document if schoolId is provided
    if (extra?.schoolId) {
      batch.delete(doc(db, 'schools', extra.schoolId));
    }
  }

  await batch.commit();

  // 3. Delete Firebase Auth user (must be last)
  await deleteUser(user);
}
