// app/admin/students/generate-bonafide/page.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
import styles from './BonafideBuilder.module.scss'; // Ensure this points to your FINAL V8 SCSS
import StudentSearch from '@/components/admin/StudentSearch/StudentSearch';
import { FiDownload, FiPrinter } from 'react-icons/fi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '@/backend/utils/api';
import Link from 'next/link';
import { MdGridView } from 'react-icons/md';
import { useAuth } from '@/app/context/AuthContext';

// --- Student Interface ---
interface Student {
  id: string;
  name: string;
  class?: string;
  dob?: string;
  address?: string;
}

// --- School Details Interface ---
interface SchoolDetails {
  name: string;
  name2?: string;
  address: string;
  mobNo?: string;
  email?: string;
  govtReg?: string;
  udiseNo?: string;
  logoUrl?: string;
  place?: string;
}

// --- Form Data State ---
interface BonafideFormData {
  certificateNo: string;
  academicYear: string;
  reasonText: string;
  includeCharacter: boolean;
  principalRole: string;
  issueDate: string;
}

// --- Helper Functions ---
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return ''; // Return empty string for placeholder logic below
  try {
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  } catch (e) { return 'Invalid Date'; }
};

// --- ✅ FINAL V8: BonafidePDFPreview Component ---
// No JSX changes needed, CSS handles the alignment
const BonafidePDFPreview = ({
  student,
  formData,
  schoolDetails
}: {
  student: Student | null;
  formData: BonafideFormData;
  schoolDetails: SchoolDetails;
}) => {
  // Use conditional rendering for placeholders/blanks
  const studentNameNode = student?.name ? <span className={styles.fillIn}>{student.name}</span> : <span className={styles.fillInBlank}>&nbsp;</span>;
  const studentClassNode = student?.class ? <span className={styles.fillIn}>{student.class}</span> : <span className={styles.fillInBlank}>&nbsp;</span>;
  const studentDobNode = student?.dob ? <span className={styles.fillIn}>{formatDate(student.dob)}</span> : <span className={styles.fillInBlank}>&nbsp;</span>;
  const studentAddressText = student?.address || '';
  const academicYearNode = formData.academicYear ? <span className={styles.fillIn}>{formData.academicYear}</span> : <span className={styles.fillInBlank}>&nbsp;</span>;
  const reasonTextNode = formData.reasonText ? <span className={styles.fillIn}>{formData.reasonText}</span> : <span className={styles.fillInBlank}>&nbsp;</span>;
  const dynamicPlaceNode = schoolDetails.place ? <span className={styles.fillInFooter}>{schoolDetails.place}</span> : <span className={styles.fillInBlank}>&nbsp;</span>;
  const issueDateNode = formData.issueDate ? <span className={styles.fillInFooter}>{formatDate(formData.issueDate)}</span> : <span className={styles.fillInBlank}>&nbsp;</span>;
  const certNoNode = formData.certificateNo ? <span className={styles.fillIn}>{formData.certificateNo}</span> : <span className={styles.fillInBlank}>&nbsp;</span>;

  const isAddressEmpty = !student?.address;

  return (
    // The ref goes on the outermost div that represents the paper
    <div className={styles.certificatePaper}>
      {/* Header */}
      <header className={styles.certHeader}>
        {schoolDetails.logoUrl && (
          <img src={schoolDetails.logoUrl} alt="School Logo" className={styles.logo} />
        )}
        <div className={styles.schoolInfoBlock}>
          <h3 className={styles.schoolName1}>{schoolDetails.name}</h3>
          <h2 className={styles.schoolName2}>{schoolDetails.name2 || schoolDetails.name}</h2>
          <p className={styles.schoolAddress}>{schoolDetails.address}</p>
          <p className={styles.schoolContact}>
            {schoolDetails.mobNo && `Mob. No.: ${schoolDetails.mobNo} `}
            {schoolDetails.email && `Email: ${schoolDetails.email}`}
          </p>
          <div className={styles.regInfo}>
            <span>{schoolDetails.govtReg && `Govt Reg. ${schoolDetails.govtReg}`}</span>
            <span>{schoolDetails.udiseNo && `UDISE No. ${schoolDetails.udiseNo}`}</span>
          </div>
        </div>
      </header>

      {/* Meta Info Area Wrapper (Below Header Line) */}
      <div className={styles.metaArea}>
          {/* Certificate Number - Now on the Left */}
          <div className={styles.certNo}>
             Certificate No.: {certNoNode} {/* Render node directly */}
          </div>

           {/* Title Wrapper for Centering - Now inside metaArea */}
          <div className={styles.certTitleWrapper}>
              <div className={styles.certTitle}>
                <h2>Bonafide & Character Certificate</h2>
              </div>
          </div>

          {/* Photo Box Area - Absolute Positioned on the Right */}
          <div className={styles.photoBoxArea}>
              <div className={styles.photoBox}></div>
          </div>
      </div>

      {/* Body Content */}
      <div className={styles.certBody}>
        <p className={styles.listItem}>
          <span className={styles.listNumber}>1)</span>
          This is to certify that Shri/Smt {studentNameNode} {/* */}
          is / was a Bonafide of this School / College & is / was {/* */}
          Studying in {studentClassNode} {/* */}
          Class during {academicYearNode}.
        </p>
        <p className={styles.listItem}>
          <span className={styles.listNumber}>2)</span>
          As per record of this office his / her Date of birth is {studentDobNode}.
        </p>
        {/* Address Line */}
        <p className={`${styles.listItem} ${styles.addressLine} ${isAddressEmpty ? styles.emptyAddress : ''}`}>
          <span className={styles.listNumber}>3)</span>
          His/her permanent / local address as per record is {/* */}
          <span className={styles.fillInAddress}>{studentAddressText}</span>
          {/* Line applied via CSS */}
        </p>
        <p className={styles.listItem}>
          <span className={styles.listNumber}>4)</span>
          The Bonafide is issued for {reasonTextNode}.
        </p>
        <p className={styles.listItem}>
          <span className={styles.listNumber}>5)</span>
          This School / College is recognized by Government of Maharashtra.
        </p>
        {formData.includeCharacter && (
          <p className={styles.listItem}>
            <span className={styles.listNumber}>6)</span>
            According to my knowledge he / She bears a good moral Character.
          </p>
        )}
      </div>

      {/* Footer */}
      <footer className={styles.certFooter}>
        <div className={styles.placeDate}>
          <p>Place : {dynamicPlaceNode}</p>
          <p>Date : {issueDateNode}</p>
        </div>
        <div className={styles.signatures}>
          <div className={styles.sigBox}>
            <span>Cleark</span> {/* PDF uses "Cleark" */}
          </div>
          <div className={styles.sigBox}>
            <span>{formData.principalRole}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};


// --- BonafidePDFForm Component (No change needed) ---
const BonafidePDFForm = ({
  formData,
  setFormData
}: {
  formData: BonafideFormData;
  setFormData: React.Dispatch<React.SetStateAction<BonafideFormData>>;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  const currentYear = new Date().getFullYear();
  const academicYearPlaceholder = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

  return (
    <form className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="certificateNo">Certificate No.</label>
        <input type="text" id="certificateNo" name="certificateNo" value={formData.certificateNo} onChange={handleChange} placeholder="e.g., 01" />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="academicYear">Academic Year (Point 1)</label>
        <input type="text" id="academicYear" name="academicYear" value={formData.academicYear} onChange={handleChange} placeholder={academicYearPlaceholder} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="reasonText">Reason for Issuing (Point 4)</label>
        <input type="text" id="reasonText" name="reasonText" value={formData.reasonText} onChange={handleChange} placeholder="e.g., Scholarship Application" />
      </div>
       <div className={styles.formGroupCheckbox}>
        <input
          type="checkbox"
          id="includeCharacter"
          name="includeCharacter"
          checked={formData.includeCharacter}
          onChange={handleChange}
        />
        <label htmlFor="includeCharacter">Include Character Statement (Point 6)</label>
      </div>
       <div className={styles.formGroup}>
        <label htmlFor="issueDate">Issue Date (Footer)</label>
        <input type="date" id="issueDate" name="issueDate" value={formData.issueDate} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="principalRole">Signatory Role (Footer)</label>
        <select id="principalRole" name="principalRole" value={formData.principalRole} onChange={handleChange}>
          <option value="Principal">Principal</option>
          <option value="Head Master">Head Master</option>
        </select>
      </div>
    </form>
  );
};


// --- MAIN PAGE COMPONENT ---
const BonafideBuilderPage = () => {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const certificateRef = useRef<HTMLDivElement | null>(null); // Ref for the certificatePaper div

  const [formData, setFormData] = useState<BonafideFormData>({
    certificateNo: '',
    academicYear: `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`,
    reasonText: '',
    includeCharacter: true,
    principalRole: 'Principal',
    issueDate: new Date().toISOString().split('T')[0],
  });

  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails>({
    name: "Loading School...",
    name2: "",
    address: "Loading Address...",
    mobNo: "Loading Contact...",
    email: "Loading Email...",
    govtReg: "Loading Reg...",
    udiseNo: "Loading UDISE...",
    place: "Loading Place...",
    logoUrl: undefined
  });

  useEffect(() => {
    const fetchSchoolProfile = async () => {
      console.log("Fetching full school profile for certificate...");
      try {
        const res = await api.get('/api/school/profile');
        if (res.data) {
          console.log("School profile data received:", res.data);
          setSchoolDetails({
            name: res.data.name || "School Name Not Found",
            name2: res.data.name2 || res.data.name,
            logoUrl: res.data.logoUrl || undefined,
            address: res.data.address || "Address Not Found",
            mobNo: res.data.contactNumber || "Contact Not Found",
            email: res.data.email || "Email Not Found",
            govtReg: res.data.recognitionNumber || "Reg. Not Found",
            udiseNo: res.data.udiseNo || "UDISE Not Found",
            place: res.data.place || "Place Not Found"
          });
        } else {
           throw new Error("No data received from school profile API");
        }
      } catch (err) {
        console.error("Failed to fetch school profile:", err);
        setSchoolDetails(prevDetails => ({
            ...prevDetails,
            name: user?.schoolName || "School Name Error",
            name2: user?.schoolName || "School Name Error",
            address: "Address Fetch Error",
            mobNo: "Error", email: "Error", govtReg: "Error", udiseNo: "Error", place: "Error"
        }));
      }
    };
    if (user?.schoolName) {
        setSchoolDetails(prev => ({ ...prev, name: user.schoolName, name2: user.schoolName }));
    }
    fetchSchoolProfile();
  }, [user]);

  // --- Print/Download functions ---
  const handlePrint = () => {
    const input = certificateRef.current;
    if (!input || !selectedStudent) {
      alert("Please select a student and ensure preview is visible."); return;
    }
    html2canvas(input, {
        scale: 2.5,
        useCORS: true,
        logging: true,
        width: input.offsetWidth,
        height: input.offsetHeight
    } as any).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`<html><head><title>Print Certificate</title><style>@page { size: A4 portrait; margin: 0; } body { margin: 0; } img { width: 100%; height: auto; display: block; }</style></head><body><img src="${imgData}" /></body></html>`);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        };
      }
    }).catch(err => {
        console.error("html2canvas error during print:", err);
        alert("Could not generate image for printing. Check console for errors.");
    });
  };

  const handleDownloadPDF = () => {
    const input = certificateRef.current;
    if (!selectedStudent) { alert("Please select a student first."); return; }
    if (!input) { alert("Preview element not found."); return; }
    html2canvas(input, {
        scale: 3,
        useCORS: true,
        logging: true,
        width: input.offsetWidth,
        height: input.offsetHeight
     } as any)
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / canvas.height;
        const margin = 10;
        let imgWidth = pdfWidth - (margin * 2);
        let imgHeight = imgWidth / ratio;
        let xOffset = margin;
        let yOffset = margin;

        if (imgHeight > pdfHeight - (margin * 2)) {
            imgHeight = pdfHeight - (margin * 2);
            imgWidth = imgHeight * ratio;
            xOffset = (pdfWidth - imgWidth) / 2;
        } else {
             yOffset = (pdfHeight - imgHeight) / 2;
        }

        pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
        pdf.save(`Bonafide_${selectedStudent.name.replace(/ /g, '_')}.pdf`);
      }).catch(err => {
          console.error("html2canvas error during PDF download:", err);
          alert("Could not generate PDF. Check console for errors.");
      });
  };

  // --- JSX Return ---
  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>Bonafide & Character Certificate Builder</h1>
        <p>Search student, fill details, and preview the certificate based on the required format.</p>
      </header>

      <div className={styles.builderLayout}>
        {/* Controls Column */}
        <div className={styles.controlsColumn}>
          <div className={styles.controlSection}>
            <h2>1. Select Student</h2>
            {/* Make sure StudentSearch returns StudentFullProfile */}
            <StudentSearch onStudentSelect={(student) => setSelectedStudent(student as Student)} />
             <p className={styles.note}>
              Student Search needs to provide: Name, Class, Date of Birth, and Address.
            </p>
          </div>
          {selectedStudent && (
            <>
              <div className={styles.controlSection}>
                <h2>2. Fill Certificate Details</h2>
                <BonafidePDFForm
                  formData={formData}
                  setFormData={setFormData}
                />
              </div>
              <div className={styles.actionsWrapper}>
                  <button onClick={handleDownloadPDF} type="button" className={`${styles.actionButton} ${styles.download}`}>
                      <FiDownload /> Download PDF
                  </button>
                  <button onClick={handlePrint} type="button" className={`${styles.actionButton} ${styles.print}`}>
                      <FiPrinter /> Print
                  </button>
              </div>
            </>
          )}
        </div>

        {/* Preview Column */}
        <div className={styles.previewColumn}>
          <h2>Live Preview</h2>
          <div className={styles.previewWrapper}>
             {/* The ref MUST be on the div containing BonafidePDFPreview */}
            <div ref={certificateRef}>
              <BonafidePDFPreview
                student={selectedStudent}
                formData={formData}
                schoolDetails={schoolDetails}
              />
            </div>
          </div>
        </div>
      </div>

       {/* Link to Dashboard */}
       <Link href="/admin/students" className={styles.dashboardLinkButton}>
          <MdGridView />
          Go to Students Dashboard
       </Link>
    </div>
  );
};

export default BonafideBuilderPage;