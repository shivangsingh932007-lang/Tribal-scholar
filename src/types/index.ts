export type UserRole = 'STUDENT' | 'OFFICER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  mobile: string;
  createdAt?: string;
}

export interface StudentProfile {
  userId: string;
  fullName: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  mobile: string;
  email: string;
  state: string;
  district: string;
  villageTown: string;
  category: 'ST';
  stCertificateNo: string;
  stStatus: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  pvtgStatus: boolean;
  pvtgGroup?: string;
  aadhaarMasked: string; // e.g. "XXXX-XXXX-9142"
  aadhaarVerified: boolean;
  apaarId?: string; // e.g. "APAAR-2026-8839-4412"
  otrId?: string; // One Time Registration ID e.g. "OTR-ST-991204"
  institutionName: string;
  institutionType: 'GOVERNMENT_SCHOOL' | 'GOV_AIDED_SCHOOL' | 'CENTRAL_INSTITUTE' | 'STATE_UNIVERSITY' | 'PREMIER_INSTITUTE_IIT_NIT_IIM' | 'FOREIGN_UNIVERSITY';
  institutionCode?: string;
  courseName: string;
  courseLevel: 'PRE_MATRIC' | 'POST_MATRIC_HS' | 'UNDERGRADUATE' | 'POSTGRADUATE' | 'MPHIL_PHD' | 'OVERSEAS_MASTERS_PHD';
  classYear: string;
  academicPercentage: number;
  familyAnnualIncome: number;
  bankAccountNo: string; // masked in UI e.g. "XXXXXX4512"
  bankIfsc: string;
  bankName: string;
  bankVerified: boolean;
  profileCompleted: boolean;
  updatedAt?: string;
}

export type SchemeCode = 'PRE_MATRIC' | 'POST_MATRIC' | 'TOP_CLASS' | 'NFST' | 'NOS';

export interface Scheme {
  id: string;
  code: SchemeCode;
  nameEn: string;
  nameHi: string;
  ministry: string;
  descriptionEn: string;
  descriptionHi: string;
  maxIncomeLimit: number;
  academicLevel: string;
  eligibleClasses: string;
  benefitsEn: string;
  benefitsHi: string;
  applicationPeriodStart: string;
  applicationPeriodEnd: string;
  sampleSanctionAmount: number;
  isActive: boolean;
  faqs?: Array<{ questionEn: string; questionHi: string; answerEn: string; answerHi: string }>;
}

export interface EligibilityResult {
  schemeId: string;
  schemeCode: SchemeCode;
  schemeNameEn: string;
  schemeNameHi: string;
  status: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'NEEDS_VERIFICATION';
  reasons: string[];
  failedConditions: string[];
  requiredDocuments: string[];
  additionalVerificationRequired?: string;
  maxIncomeLimit: number;
  sampleAmount: number;
}

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_VERIFICATION'
  | 'DEFICIENCY'
  | 'RESUBMITTED'
  | 'VERIFIED'
  | 'APPROVED'
  | 'SANCTIONED'
  | 'DISBURSED'
  | 'REJECTED';

export interface Application {
  id: string;
  applicationNumber: string; // e.g. TRIBAL-2026-004921
  studentId: string;
  schemeId: string;
  schemeCode: SchemeCode;
  schemeNameEn: string;
  schemeNameHi: string;
  academicYear: string;
  status: ApplicationStatus;
  submittedAt?: string;
  updatedAt: string;
  createdAt: string;
  studentName?: string;
  studentEmail?: string;
  studentMobile?: string;
  stCertificateNo?: string;
  familyAnnualIncome?: number;
  sanctionAmount?: number;
  documents?: ApplicationDocument[];
  timeline?: StatusHistoryItem[];
  deficiencies?: Deficiency[];
  verificationResults?: VerificationResult[];
  payment?: PaymentRecord;
}

export interface ApplicationDetails {
  applicationId: string;
  personalDetails: {
    fullName: string;
    dob: string;
    gender: string;
    mobile: string;
    email: string;
    state: string;
    district: string;
    villageTown: string;
    category: string;
    stCertificateNo: string;
    pvtgStatus: boolean;
    pvtgGroup?: string;
    aadhaarMasked: string;
  };
  academicDetails: {
    institutionName: string;
    institutionType: string;
    institutionCode?: string;
    courseName: string;
    courseLevel: string;
    classYear: string;
    previousPercentage: number;
    apaarId?: string;
    foreignUniversityOffer?: string; // For NOS
    researchTopic?: string; // For NFST
  };
  familyIncomeDetails: {
    fatherName: string;
    motherName: string;
    guardianOccupation: string;
    familyAnnualIncome: number;
    incomeCertificateNo: string;
    issuingAuthority: string;
    issueDate: string;
  };
  bankDetails: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branchName: string;
  };
  declarationSigned: boolean;
  declarationDate: string;
}

export type DocumentType =
  | 'ST_CERTIFICATE'
  | 'INCOME_CERTIFICATE'
  | 'AADHAAR_PROOF'
  | 'DOMICILE_CERTIFICATE'
  | 'MARKSHEET'
  | 'MARKSHEET_10TH'
  | 'MARKSHEET_12TH'
  | 'BONAFIDE_CERTIFICATE'
  | 'BANK_PASSBOOK'
  | 'ADMISSION_PROOF'
  | 'INSTITUTION_CERTIFICATE'
  | 'OFFER_LETTER_FOREIGN'
  | 'RESEARCH_PROPOSAL';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, { en: string; hi: string }> = {
  ST_CERTIFICATE: { en: 'ST Caste Certificate', hi: 'एसटी जाति प्रमाण पत्र' },
  INCOME_CERTIFICATE: { en: 'Income Certificate', hi: 'आय प्रमाण पत्र' },
  AADHAAR_PROOF: { en: 'Aadhaar Card', hi: 'आधार कार्ड' },
  DOMICILE_CERTIFICATE: { en: 'Domicile Certificate', hi: 'मूल निवास प्रमाण पत्र' },
  MARKSHEET_10TH: { en: '10th Class Marksheet (Secondary)', hi: '10वीं कक्षा की अंकतालिका' },
  MARKSHEET_12TH: { en: '12th Class Marksheet (Higher Secondary)', hi: '12वीं कक्षा की अंकतालिका' },
  MARKSHEET: { en: 'Degree / Other Marksheet', hi: 'स्नातक / अन्य अंकतालिका' },
  BONAFIDE_CERTIFICATE: { en: 'Bonafide / Enrollment Certificate', hi: 'बोनाफाइड / नामांकन प्रमाण पत्र' },
  BANK_PASSBOOK: { en: 'Bank Passbook / Cancelled Cheque', hi: 'बैंक पासबुक / चेक' },
  ADMISSION_PROOF: { en: 'Admission Fee Receipt / Proof', hi: 'प्रवेश शुल्क रसीद' },
  INSTITUTION_CERTIFICATE: { en: 'Institution Verification Certificate', hi: 'संस्थान प्रमाण पत्र' },
  OFFER_LETTER_FOREIGN: { en: 'Foreign University Offer Letter', hi: 'विदेशी विश्वविद्यालय ऑफर लेटर' },
  RESEARCH_PROPOSAL: { en: 'Research Proposal Synopsis', hi: 'शोध प्रस्ताव' },
};

export interface WalletDocument {
  id: string;
  userId: string;
  docType: DocumentType;
  docName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  status: 'ACTIVE' | 'ARCHIVED';
  verificationStatus?: 'VERIFIED' | 'PENDING' | 'DEFICIENT';
  digilockerVerified?: boolean | number;
  certNumber?: string;
  fileUri?: string;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  documentId: string;
  docType: DocumentType;
  docName: string;
  fileUrl: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'DEFICIENT';
  officerRemarks?: string;
  verifiedAt?: string;
}

export type VerificationSource =
  | 'DIGILOCKER'
  | 'APAAR'
  | 'UDISE_PLUS'
  | 'UIDAI'
  | 'STATE_EDISTRICT'
  | 'AISHE'
  | 'UGC_NTA';

export interface VerificationResult {
  id: string;
  applicationId: string;
  adapterSource: VerificationSource;
  outcome: 'VERIFIED' | 'MISMATCH' | 'NOT_FOUND' | 'PENDING' | 'MANUAL_REVIEW';
  submittedValue?: string;
  verifiedValue?: string;
  mismatchField?: string;
  officerAction?: string;
  notes?: string;
  verifiedAt: string;
}

export interface Deficiency {
  id: string;
  applicationId: string;
  createdByOfficerId: string;
  deficiencyType: string;
  fieldName: string;
  reasonEn: string;
  reasonHi: string;
  requiredActionEn: string;
  requiredActionHi: string;
  deadline: string;
  status: 'OPEN' | 'RESOLVED' | 'REJECTED';
  resolutionRemarks?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface StatusHistoryItem {
  id: string;
  applicationId: string;
  fromStatus: string;
  toStatus: ApplicationStatus;
  actorId: string;
  actorRole: string;
  remarks: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  applicationId: string;
  sanctionId: string;
  sanctionNumber?: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  dbtBatchNo?: string;
  transactionRef?: string;
  paymentDate?: string;
  bankIfsc: string;
  bankAccountLast4: string;
  failureReason?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  titleEn: string;
  titleHi: string;
  messageEn: string;
  messageHi: string;
  type: 'INFO' | 'ACTION_REQUIRED' | 'DEFICIENCY' | 'SUCCESS' | 'WARNING';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface OutreachCandidate {
  id: string;
  sourceSystem: 'UDISE_PLUS' | 'APAAR' | 'OTR';
  candidateName: string;
  maskedId: string;
  district: string;
  state: string;
  currentClassCourse: string;
  institution: string;
  estimatedIncome: number;
  pvtgStatus: boolean;
  stStatus: string;
  recommendedSchemeCode: SchemeCode;
  recommendedSchemeName: string;
  matchConfidence: number;
  outreachStatus: 'IDENTIFIED' | 'NOTIFIED' | 'APPLICATION_STARTED' | 'ENROLLED';
  notes: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jago';
  text: string;
  timestamp: string;
  intent?: string;
  dataCard?: {
    type: 'status' | 'deficiency' | 'eligibility' | 'schemes' | 'payment';
    title: string;
    details: Array<{ label: string; value: string }>;
    actionUrl?: string;
    actionLabel?: string;
  };
}
