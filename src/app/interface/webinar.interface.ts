// webinar.interface.ts

export interface Webinar {
  _id: string;
  title: string;
  description: string;
  topic: string;
  host: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  thumbnail: string;
  modeType: 'offline' | 'online';
  address: string;
  mapLink: string;
  zoomLink: string;
  zoomMeetingId: string;
  zoomPasscode: string;
  accessType: 'free' | 'paid';
  price: number;
  maxCapacity: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  isActive: boolean;
  webinarVideoUrl: string;
  videoRequests: VideoRequest[];
  createdAt: string;
  updatedAt: string;
  totalRegistrations?: number;
}

export interface VideoRequest {
  _id?: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    mobile_number: string;
  };
  note: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  approvedAt?: string;
}

export interface WebinarRegistration {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    mobile_number: string;
    profilePic: string;
  };
  webinarId: string;
  hasPaid: boolean;
  amount: number;
  paymentDetails: any;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  approvedAt?: string;
  registeredAt: string;
}

export interface WebinarResponse {
  docs: Webinar[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export interface RegistrationResponse {
  docs: WebinarRegistration[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export interface CreateWebinarData {
  title: string;
  description?: string;
  topic?: string;
  host: string;
  date: string;
  startTime: string;
  endTime: string;
  modeType: 'offline' | 'online';
  address?: string;
  mapLink?: string;
  zoomLink?: string;
  zoomMeetingId?: string;
  zoomPasscode?: string;
  accessType: 'free' | 'paid';
  price?: number;
  maxCapacity: number;
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

export interface UpdateWebinarData {
  webinarId: string;
  title?: string;
  description?: string;
  topic?: string;
  host?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  modeType?: 'offline' | 'online';
  address?: string;
  mapLink?: string;
  zoomLink?: string;
  zoomMeetingId?: string;
  zoomPasscode?: string;
  accessType?: 'free' | 'paid';
  price?: number;
  maxCapacity?: number;
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

export interface VideoRequestsResponse {
  webinarId: string;
  webinarTitle: string;
  totalRequests: number;
  videoRequests: VideoRequest[];
}