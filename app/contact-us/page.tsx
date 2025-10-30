"use client";


import { useState } from 'react';
import SimpleHeader from '../../components/SimpleHeader';
import Footer from '../../components/Footer';


export default function ContactUs() {
  // State for form fields
  const [formData, setFormData] = useState({
    schoolWebsite: '',
    numStudents: '',
    role: 'Principal/Leadership/Mgt',
    mediaSource: 'Google',
    painPoints: '',
  });


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };


  return (
    <>
      <SimpleHeader />
      
      <div className="contact-page-wrapper">
        <div className="contact-form-container">
          <form className="contact-form">
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="schoolWebsite">Enter Your School Name</label>
                <input type="text" id="schoolWebsite" name="schoolWebsite" value={formData.schoolWebsite} onChange={handleInputChange} className="form-input" />
              </div>
              <div className="form-field">
                <label htmlFor="numStudents">Number of Students</label>
                <input type="text" id="numStudents" name="numStudents" value={formData.numStudents} onChange={handleInputChange} className="form-input" />
              </div>
              <div className="form-field">
                <label htmlFor="role">Your Role</label>
                {/* A select dropdown menu was added here to complete the form field */}
                <select 
                  id="role" 
                  name="role" 
                  value={formData.role} 
                  onChange={handleInputChange} 
                  className="form-input"
                >
                  <option>Principal/Leadership/Mgt</option>
                  <option>Teacher/Faculty</option>
                  <option>IT Administrator</option>
                  <option>Parent</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          </form>
        </div>
      </div>


      <Footer />
    </>
  );
}