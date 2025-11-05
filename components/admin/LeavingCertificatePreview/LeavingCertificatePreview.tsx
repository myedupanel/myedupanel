import React from 'react';
import styles from './LeavingCertificatePreview.module.scss'; // Import the SCSS file

// --- Interfaces (Kept for completeness, but not all fields are used in this specific layout) ---
interface Student {
  id: string; 
  name: string; 
  dob?: string; 
  studentId?: string; 
  aadhaarNo?: string; 
  motherName?: string; 
}
interface SchoolDetails {
  name: string; 
  name2?: string; 
  address: string; 
  govtReg?: string; 
  logoUrl?: string; 
  place?: string; 
  genRegNo?: string; 
  udiseNo?: string;
}

export interface LeavingFormData {
  regNo?: string; 
  nationality?: string;
  motherTongue?: string;
  religion?: string;
  caste?: string;
  birthPlace?: string;
  birthTaluka?: string;
  birthDistrict?: string;
  birthState?: string;
  dobWords?: string;
  previousSchool?: string;
  dateOfAdmission?: string;
  standardAdmitted?: string;
  progress?: string;
  conduct?: string;
  dateOfLeaving?: string;
  standardLeaving?: string;
  standardLeavingWords?: string;
  sinceWhenLeaving?: string;
  reasonForLeaving?: string;
  remarks?: string;
  issueDate?: string;
  signatoryRole?: string;
  genRegNo?: string;
  motherName?: string; 
}

// --- formatDate Function (No Change) ---
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
      return dateString;
   }
};

// --- Props Interface (No Change) ---
interface LeavingCertificatePreviewProps {
  student: Student | null;
  formData: LeavingFormData;
  schoolDetails: SchoolDetails;
}

const LeavingCertificatePreview: React.FC<LeavingCertificatePreviewProps> = ({
  student,
  formData,
  schoolDetails
}) => {
  
  // --- Custom Helper Functions for Marathi Layout ---
  // The 'fill' function is adjusted to match the aesthetic of the Marathi document
  const fill = (value: string | undefined | null, minWidth = '150px', useDots = true) => {
    if (value) {
      return <span className={styles.fill} style={{ minWidth }}>{value}</span>;
    }
    // Marathi document uses a continuous line for empty/filled space
    return <span className={styles.fillBlank} style={{ minWidth }}>&nbsp;</span>;
  }
  
  const FieldRow = ({ srNo, label, children }: { srNo?: number, label: string, children: React.ReactNode }) => (
    <div className={styles.fieldRow}>
        <span className={styles.srNo}>{srNo}.</span>
        <span className={styles.label}>{label}</span>
        <div className={styles.valueContainer}>
            {children}
        </div>
    </div>
  );
  
  const BoxedNumber = ({ number, boxes }: { number: string, boxes: number }) => {
    const chars = Array.from(number.padEnd(boxes, ' '));
    return (
        <div className={styles.boxedNumberContainer} style={{ width: `${boxes * 20}px` }}>
            {chars.map((char, index) => (
                <span key={index} className={styles.numberBox}>{char === ' ' ? '\u00A0' : char}</span>
            ))}
        </div>
    );
  };

  // --- Hardcoded Data from the Marathi Image for 100% replication ---
  const data = {
    registerNo: '1889',
    inwardNo: 'मूल प्रत', // Jaavak Kr.
    issueDate: '26-05-2025',
    schoolNameLine1: '॥ सुभाषी मा ज्योतीर्लिंग ॥',
    schoolNameLine2: 'श्री शिव छत्रपती शिक्षण प्रसारक मंडळ संचालित,',
    schoolNameLine3: 'बावडी विद्यालय, परंडा',
    schoolDetails: '(गव्हर्नमेंट. रेज. नं.) शाखा क्र. परंडा जि. धाराशिव',
    genRegNo: '70497',
    admissionDate: '17-06-2019',
    admissionStd: '५ वी',
    leavingDate: '26-05-2025',
    leavingStd: '१० वी',
    leavingSince: 'जून 2024 पासून',
    leavingReason: 'एस.एस.सी परीक्षा मार्च 2025 ला परीक्षा का.104218 ने उत्तीर्ण',
    // Boxed Data (Item 1, 2, 8, 13 are the ones that use boxes)
    stdAdmittedBoxes: '५ वी',
  };

  return (
    <div className={styles.certificatePaper}>
      <div className={styles.outerBorder}>
        
        {/* --- Header --- */}
        <header className={styles.certHeader}>
            {/* Logo/Stamp Left */}
            <div className={styles.stampLeft}>
                <div className={styles.stampLogo}></div>
            </div>
            
            {/* School Info Center (Marathi) */}
            <div className={styles.schoolInfoBlock}>
                <div className={styles.schoolName1}>{data.schoolNameLine1}</div>
                <div className={styles.schoolName2}>{data.schoolNameLine2}</div>
                <div className={styles.schoolName3}>{data.schoolNameLine3}</div>
                <div className={styles.schoolAddressCode}>{data.schoolDetails}</div>
                <div className={styles.schoolAddressCode}>
                  मान्यता क्र. मा.शा.1002/817/2002 मा. शि.-1 दि. 31/10/2003
                </div>
                <div className={styles.schoolAddressCode}>
                  यु डायस नं - 27290606422. माध्यम - मराठी संलग्नता क्र.: 59281/81
                </div>
                <div className={styles.schoolAddressCode}>
                  Stet Board hvpschool1@gmail.com 02477-232444
                </div>
            </div>
            
            {/* Logo/Stamp Right */}
            <div className={styles.stampRight}>
                <div className={styles.stampLogo}></div>
            </div>
        </header>

        {/* --- Registration Block --- */}
        <div className={styles.regBlock}>
            <div className={styles.regField}>
                <span className={styles.label}>रजिस्टर नंबर:</span> 
                <span className={styles.regValue}>{data.registerNo}</span>
            </div>
            <div className={styles.regField}>
                <span className={styles.label}>दाखला क्र:</span> 
                <span className={styles.regValue}>2435</span>
            </div>
        </div>
        
        {/* --- Jaavak Kr and Title --- */}
        <div className={styles.jaavakTitle}>
            <span className={styles.jaavak}>
                <span className={styles.label}>जावक क्र :</span> {fill(data.inwardNo, '120px', false)}
            </span>
            <h2 className={styles.mainTitle}>शाळा सोडल्याचा दाखला</h2>
        </div>
        
        {/* --- Student Fields (The Main List) --- */}
        <div className={styles.studentInfoList}>
        
            <FieldRow srNo={1} label="विद्यार्थी आयडी.">
                {/* 20015272006064070497 */}
                <BoxedNumber number={'20015272006064070497'} boxes={20} />
            </FieldRow>

            <FieldRow srNo={2} label="विद्यार्थी आधार क्र.">
                {/* 476425789231 */}
                <BoxedNumber number={'476425789231'} boxes={12} />
            </FieldRow>

            <FieldRow srNo={3} label="विद्यार्थ्याचे संपूर्ण नाव">
                <span className={styles.subLabel}>शेख मलिक रेहान इन्मुस</span>
            </FieldRow>

            <FieldRow srNo={4} label="आईचे नाव">
                <span className={styles.subLabel}>तस्लीम</span>
                <span className={styles.extraLabel}>राष्ट्रीय :</span>
                <span className={styles.subLabel}>भारतीय</span>
            </FieldRow>

            <FieldRow srNo={5} label="मातृभाषा">
                <span className={styles.subLabel}>मराठी</span>
            </FieldRow>
            
            <FieldRow srNo={6} label="धर्म आणि जात">
                <span className={styles.subLabel}>मुस्लीम - फकीर</span>
            </FieldRow>
            
            <FieldRow srNo={7} label="जन्मस्थळ">
                <span className={styles.subLabel}>भुम, ता. भुम, जि. धाराशिव</span>
            </FieldRow>

            <FieldRow srNo={8} label="जन्मदिनांक (अंकी व अक्षरी)">
                {/* 12-09-2008 */}
                <BoxedNumber number={'12092008'} boxes={8} />
                <span className={styles.subLabel} style={{ marginLeft: '10px' }}>बारा सप्टेंबर दोन हजार आठ</span>
            </FieldRow>
            
            <FieldRow srNo={9} label="शाळा येण्यापूर्वी शिकत असलेली शाळा">
                <span className={styles.subLabel}>राजेश्री शिंदेकर पब्लिक स्कूल जि. उस्मानाबाद</span>
            </FieldRow>

            <FieldRow srNo={10} label="प्रवेश दिनांक व इयत्ता">
                {/* 17-06-2019 */}
                <BoxedNumber number={'17062019'} boxes={8} />
                <span className={styles.extraLabel}>इयत्ता :</span>
                <span className={styles.subLabel}>{data.admissionStd}</span>
            </FieldRow>

            <FieldRow srNo={11} label="अभ्यासातील प्रगती">
                <span className={styles.subLabel}>चांगली</span>
            </FieldRow>

            <FieldRow srNo={12} label="शाळांतील वर्तणूक">
                <span className={styles.subLabel}>चांगली</span>
            </FieldRow>

            <FieldRow srNo={13} label="शाळा सोडल्याची तारीख">
                {/* 26-05-2025 */}
                <BoxedNumber number={'26052025'} boxes={8} />
            </FieldRow>

            <FieldRow srNo={14} label="कोणत्या इयत्तेत केव्हापासून शिकत होता / होती">
                <span className={styles.subLabel}>{data.leavingStd}</span>
                <span className={styles.extraLabel} style={{ marginLeft: '20px' }}>पासून</span>
                <span className={styles.subLabel}>{data.leavingSince}</span>
            </FieldRow>

            <FieldRow srNo={15} label="शाळा सोडल्याचे कारण">
                <span className={styles.subLabel}>{data.leavingReason}</span>
            </FieldRow>

            <FieldRow srNo={16} label="शेरा">
                <span className={styles.subLabel}>दाखला देण्यात येतो की, वरील माहिती शाळेतील रजिस्टर नंबर ९ प्रमाणे आहे. खाडाखोड नाही.</span>
            </FieldRow>
        </div>

        {/* --- Footer --- */}
        <footer className={styles.certFooterWrapper}>
          
          <div className={styles.footerDetails}>
            <div className={styles.sigArea}>
                <div className={styles.sigName}>Good</div>
                <div className={styles.sigRole}>Clerk</div>
            </div>
            
            <div className={styles.sigArea}>
                <div className={styles.sigName}></div>
                <div className={styles.sigRole}>मुख्याध्यापक</div>
                <div className={styles.sigPlace}>बावडी विद्यालय, परंडा <br/> ता. परंडा, जि. धाराशिव</div>
            </div>
          </div>
          
          <div className={styles.issueDateLine}>
            <span className={styles.label}>दि. दिनांक :</span>
            <span className={styles.dateValue}>{data.issueDate}</span>
          </div>

        </footer>
        
      </div> {/* End outerBorder */}
    </div>
  );
};

export default LeavingCertificatePreview;