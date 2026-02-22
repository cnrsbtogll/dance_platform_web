import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

export interface EarningsSummary {
  totalGross: number;
  monthlyGross: number;
  pendingAmount: number;
  paidAmount: number;
}

export interface Transaction {
  id: string;
  studentName: string;
  itemName: string;
  amount: number;
  date: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'paid';
  type: 'course' | 'ticket';
}

/**
 * Gets earnings data for a school or instructor
 */
export const getEarningsData = async (userId: string, role: 'school' | 'instructor'): Promise<{
  summary: EarningsSummary;
  transactions: Transaction[];
}> => {
  try {
    let courseIds: string[] = [];
    const courseNamesMap = new Map<string, string>();

    // 1. Get courses associated with the user/role
    const coursesRef = collection(db, 'courses');
    const fieldToFilter = role === 'school' ? 'schoolId' : 'instructorId';
    const coursesQuery = query(coursesRef, where(fieldToFilter, '==', userId));
    const coursesSnapshot = await getDocs(coursesQuery);
    
    courseIds = coursesSnapshot.docs.map(doc => doc.id);
    coursesSnapshot.docs.forEach(doc => {
      courseNamesMap.set(doc.id, doc.data().name);
    });

    // 2. Fetch Bookings (Course Earnings)
    let bookings: any[] = [];
    if (courseIds.length > 0) {
      // Divide courseIds into chunks of 10 for Firestore 'in' query if needed, 
      // but usually schools/instructors don't have hundreds of courses yet.
      // For simplicity, we fetch all and filter in memory if more than 10.
      const bookingsRef = collection(db, 'bookings');
      const bookingsSnapshot = await getDocs(bookingsRef);
      
      bookings = bookingsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((b: any) => courseIds.includes(b.lessonId));
    }

    // 3. Fetch Tickets (Ticket Earnings)
    const ticketsRef = collection(db, 'tickets');
    const ticketsQuery = query(ticketsRef, where('sellerId', '==', userId));
    const ticketsSnapshot = await getDocs(ticketsQuery);
    const ticketTransactions: any[] = ticketsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 4. Process and Combine Data
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const transactions: Transaction[] = [];
    let totalGross = 0;
    let monthlyGross = 0;
    let pendingAmount = 0;
    let paidAmount = 0;

    // Process Bookings
    bookings.forEach(booking => {
      const amountStr = String(booking.price || '0').replace(/[^\d.]/g, '');
      const amount = parseFloat(amountStr) || 0;
      const date = booking.createdAt instanceof Timestamp 
        ? booking.createdAt.toDate() 
        : new Date();
      
      const status: any = booking.paymentStatus === 'paid' ? 'confirmed' : 'pending';

      const transaction: Transaction = {
        id: booking.id,
        studentName: booking.studentName || 'İsimsiz Öğrenci',
        itemName: courseNamesMap.get(booking.lessonId) || 'Bilinmeyen Kurs',
        amount: amount,
        date: date.toISOString(),
        status: booking.payoutStatus === 'paid' ? 'paid' : status,
        type: 'course'
      };

      transactions.push(transaction);

      if (transaction.status !== 'cancelled') {
        totalGross += amount;
        
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          monthlyGross += amount;
        }

        if (transaction.status === 'pending') {
          pendingAmount += amount;
        } else if (transaction.status === 'paid') {
          paidAmount += amount;
        }
      }
    });

    // Process Tickets
    ticketTransactions.forEach(ticket => {
      const amountStr = String(ticket.fiyatBilgileri?.indirimliFiyat || '0').replace(/[^\d.]/g, '');
      const amount = parseFloat(amountStr) || 0;
      const date = ticket.olusturulmaTarihi instanceof Timestamp 
        ? ticket.olusturulmaTarihi.toDate() 
        : new Date();

      const transaction: Transaction = {
        id: ticket.id,
        studentName: 'Bilet Satışı',
        itemName: ticket.festivalBilgileri?.festivalAdi || 'Festival Bileti',
        amount: amount,
        date: date.toISOString(),
        status: ticket.durum === 'aktif' ? 'confirmed' : 'cancelled',
        type: 'ticket'
      };

      transactions.push(transaction);

      if (transaction.status === 'confirmed') {
        totalGross += amount;
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          monthlyGross += amount;
        }
      }
    });

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      summary: {
        totalGross,
        monthlyGross,
        pendingAmount,
        paidAmount
      },
      transactions
    };
  } catch (error) {
    console.error('Kazanç verileri getirilirken hata:', error);
    throw error;
  }
};

// Keep old function for backward compatibility but update to use new core logic
export const getSchoolEarnings = (schoolId: string) => getEarningsData(schoolId, 'school');
