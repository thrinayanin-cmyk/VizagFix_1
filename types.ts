export type ComplaintStatus = 'received' | 'checking' | 'in_progress' | 'solved';

export type ComplaintCategory =
  | 'Pothole & Roads'
  | 'Street Lights'
  | 'Garbage Cleanliness'
  | 'Water Supply & Leaks'
  | 'Drainage & Sewers'
  | 'Public Safety'
  | 'Other Problem';

export interface ComplaintUpdate {
  id: string;
  date: string;
  title: string;
  note: string;
  officerName?: string;
  department?: string;
  status: ComplaintStatus;
}

export interface Complaint {
  id: string;
  title: string;
  category: ComplaintCategory;
  description: string;
  urgency: 'Normal' | 'Urgent';
  location: {
    lat: number;
    lng: number;
    address: string;
    pincode: string;
    landmark?: string;
  };
  photos: string[];
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  estimatedDays: number;
  assignedOfficer?: {
    name: string;
    department: string;
    phone: string;
  };
  updates: ComplaintUpdate[];
  citizenNote?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  address: string;
  pincode: string;
  avatarUrl: string;
  joinedDate: string;
  isGoogleUser?: boolean;
}
