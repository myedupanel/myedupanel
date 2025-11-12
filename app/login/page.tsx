                <div className={styles.inputGroup}>
                  <label htmlFor="password">Password</label>
                  <div className={styles.passwordWrapper}>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      id="password" 
                      name="password"
                      value={formData.password}
                      onChange={handleChange} 
                      required 
                      placeholder="Please Enter Your Password"
                    />
                    <span onClick={() => setShowPassword(!showPassword)} className={styles.eyeIcon}>
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </span>
                  </div>
                  <div className={styles.forgotPasswordRow}>
                    <Link href="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
                  </div>
                </div>
                
                {error && <div className={styles.errorMessage}>{error}</div>}

                <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                  {isLoading ? 'Signing in...' : (
                    <><span>Signin</span><FiArrowRight /></>
                  )}
                </button>