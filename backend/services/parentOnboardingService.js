// File: backend/services/parentOnboardingService.js
// Automated Parent Onboarding Service

const prisma = require('../config/prisma');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class ParentOnboardingService {
  // Generate secure temporary password
  static generateTemporaryPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }

  // Create parent user account automatically
  static async createParentAccount(parentData, schoolId, adminId) {
    try {
      const { name, email, contactNumber, studentId, occupation } = parentData;
      const lowerCaseEmail = email.toLowerCase().trim();

      // Check if parent already exists
      const existingParent = await prisma.parent.findUnique({
        where: {
          schoolId_email: {
            schoolId: schoolId,
            email: lowerCaseEmail
          }
        },
        include: {
          user: true
        }
      });

      if (existingParent) {
        // If parent exists but no user account, create one
        if (!existingParent.user) {
          const tempPassword = this.generateTemporaryPassword();
          const hashedPassword = await bcrypt.hash(tempPassword, 10);

          const user = await prisma.user.create({
            data: {
              name: name.trim(),
              email: lowerCaseEmail,
              password: hashedPassword,
              role: 'Parent',
              schoolId: schoolId,
              createdById: adminId,
              status: 'active',
              isVerified: false,
              parent: {
                connect: { id: existingParent.id }
              }
            }
          });

          // Send welcome email with credentials
          await this.sendParentCredentialsEmail(user, tempPassword, existingParent.studentId);
          
          return {
            success: true,
            message: 'Parent account created and credentials sent via email',
            parent: existingParent,
            user: user
          };
        }
        
        return {
          success: false,
          message: 'Parent account already exists',
          parent: existingParent
        };
      }

      // Create new parent record and user account
      const tempPassword = this.generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Create parent and user in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create parent record
        const parent = await tx.parent.create({
          data: {
            name: name.trim(),
            email: lowerCaseEmail,
            contactNumber: contactNumber,
            occupation: occupation || null,
            schoolId: schoolId,
            studentId: studentId
          }
        });

        // Create user account
        const user = await tx.user.create({
          data: {
            name: name.trim(),
            email: lowerCaseEmail,
            password: hashedPassword,
            role: 'Parent',
            schoolId: schoolId,
            createdById: adminId,
            status: 'active',
            isVerified: false,
            parent: {
              connect: { id: parent.id }
            }
          }
        });

        return { parent, user };
      });

      // Send welcome email with credentials
      await this.sendParentCredentialsEmail(result.user, tempPassword, studentId);

      return {
        success: true,
        message: 'Parent account created successfully and credentials sent via email',
        parent: result.parent,
        user: result.user
      };

    } catch (error) {
      console.error('Parent Account Creation Error:', error);
      throw new Error(`Failed to create parent account: ${error.message}`);
    }
  }

  // Send parent credentials email
  static async sendParentCredentialsEmail(user, tempPassword, studentId) {
    try {
      // Get student and school information
      const student = await prisma.students.findUnique({
        where: { studentid: studentId },
        include: {
          class: true,
          school: true
        }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      const schoolName = student.school?.name || 'Your School';
      const studentName = `${student.first_name} ${student.last_name}`;
      const className = student.class?.class_name || 'N/A';

      const subject = `Welcome to ${schoolName} Parent Portal - Your Account is Ready`;
      
      const message = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
                .credentials-box { background: white; border: 2px solid #6366F1; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .credential-item { margin: 10px 0; }
                .label { font-weight: bold; color: #4b5563; }
                .value { color: #1f2937; font-family: monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
                .button { display: inline-block; background: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to ${schoolName}</h1>
                    <p>Parent Portal Access</p>
                </div>
                
                <div class="content">
                    <h2>Hello ${user.name}!</h2>
                    <p>We're excited to welcome you to our Parent Portal. You can now monitor your child's academic progress, attendance, and communicate directly with our faculty.</p>
                    
                    <h3>Student Information:</h3>
                    <div class="credentials-box">
                        <div class="credential-item">
                            <span class="label">Student Name:</span>
                            <span class="value">${studentName}</span>
                        </div>
                        <div class="credential-item">
                            <span class="label">Class:</span>
                            <span class="value">${className}</span>
                        </div>
                        <div class="credential-item">
                            <span class="label">Roll Number:</span>
                            <span class="value">${student.roll_number}</span>
                        </div>
                    </div>

                    <h3>Your Login Credentials:</h3>
                    <div class="credentials-box">
                        <div class="credential-item">
                            <span class="label">Email:</span>
                            <span class="value">${user.email}</span>
                        </div>
                        <div class="credential-item">
                            <span class="label">Temporary Password:</span>
                            <span class="value">${tempPassword}</span>
                        </div>
                        <div class="credential-item">
                            <span class="label">Portal URL:</span>
                            <span class="value">${process.env.FRONTEND_URL}/parent/login</span>
                        </div>
                    </div>

                    <p><strong>Important Security Notice:</strong></p>
                    <ul>
                        <li>This is a temporary password that expires in 24 hours</li>
                        <li>Please change your password immediately after first login</li>
                        <li>Keep your credentials confidential and secure</li>
                    </ul>

                    <div style="text-align: center;">
                        <a href="${process.env.FRONTEND_URL}/parent/login" class="button">Access Parent Portal</a>
                    </div>

                    <h3>Features Available:</h3>
                    <ul>
                        <li>✅ Real-time attendance monitoring</li>
                        <li>✅ Academic performance tracking</li>
                        <li>✅ Fee payment history and dues</li>
                        <li>✅ Assignment submissions and deadlines</li>
                        <li>✅ Direct messaging with teachers/admin</li>
                        <li>✅ School announcements and events</li>
                        <li>✅ Study materials and resources</li>
                    </ul>

                    <p>If you have any questions or need assistance, please contact our support team.</p>
                </div>

                <div class="footer">
                    <p>© ${new Date().getFullYear()} ${schoolName}. All rights reserved.</p>
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: user.email,
        subject: subject,
        html: message
      });

      console.log(`Parent credentials email sent to: ${user.email}`);

    } catch (error) {
      console.error('Error sending parent credentials email:', error);
      throw new Error(`Failed to send parent credentials email: ${error.message}`);
    }
  }

  // Bulk parent onboarding for imported students
  static async bulkOnboardParents(parentsData, schoolId, adminId) {
    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    for (const parentData of parentsData) {
      try {
        // Skip if no valid email provided
        if (!parentData.email || !parentData.email.includes('@')) {
          results.skipped.push({
            ...parentData,
            reason: 'Invalid or missing email'
          });
          continue;
        }

        const result = await this.createParentAccount(parentData, schoolId, adminId);
        
        if (result.success) {
          results.success.push({
            ...parentData,
            parentId: result.parent.id,
            userId: result.user.id
          });
        } else {
          results.failed.push({
            ...parentData,
            reason: result.message
          });
        }
      } catch (error) {
        results.failed.push({
          ...parentData,
          reason: error.message
        });
      }
    }

    return results;
  }

  // Verify parent email (optional step)
  static async verifyParentEmail(userId) {
    try {
      const user = await prisma.user.update({
        where: { id: userId, role: 'Parent' },
        data: { isVerified: true }
      });

      // Send welcome confirmation email
      const welcomeMessage = `
        <h1>Welcome to Our Parent Community!</h1>
        <p>Dear ${user.name},</p>
        <p>Your email has been successfully verified. You can now access all features of our Parent Portal.</p>
        <p>Login to your account and explore the dashboard to monitor your child's progress.</p>
        <p>Best regards,<br>The School Administration Team</p>
      `;

      await sendEmail({
        to: user.email,
        subject: 'Email Verified - Parent Portal Access Confirmed',
        html: welcomeMessage
      });

      return { success: true, message: 'Email verified successfully' };
    } catch (error) {
      console.error('Parent Email Verification Error:', error);
      throw new Error(`Failed to verify parent email: ${error.message}`);
    }
  }
}

module.exports = ParentOnboardingService;