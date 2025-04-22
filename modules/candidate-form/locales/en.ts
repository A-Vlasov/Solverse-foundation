export const en = {
  
  send: 'Send',
  cancel: 'Cancel',
  confirm: 'Confirm',
  price: 'Price',
  free: 'FREE',
  photo: 'Photo',
  comment: 'Comment',
  message: 'Message',
  online: 'Online',
  away: 'Away',
  typing: 'typing...',
  you: 'You',
  
  
  enterMessage: 'Enter message...',
  addPhotoComment: 'Add a comment to photo...',
  readyPhotos: 'Ready Photos',
  photoPrice: 'Photo Price',
  customPrice: 'Custom Price',
  photoComment: 'Photo Comment',
  bought: 'Bought',
  notBought: 'Not Bought',
  
  
  passionateClient: 'Passionate client',
  capriciousClient: 'Capricious client',
  bargainingClient: 'Bargaining about price',
  testingBoundaries: 'Testing boundaries',
  
  
  errorSendingMessage: 'An error occurred while sending the message. Please try again.',
  errorSendingPhoto: 'An error occurred while sending the photo. Please try again.',
  sessionNotFound: 'Test session not found. Please reload the page.',
  
  
  chat: {
    timeExpired: 'Time expired. Message sending is disabled.'
  },
  
  
  selectPhotoPrice: 'Select Photo Price',
  confirmSendPhoto: 'Send Photo',
  
  
  congratulations: 'Congratulations!',
  testCompletedSuccessfully: 'You have successfully completed the communication skills test.',
  calculatingResults: 'Calculating results...',
  itWillTakeSeconds: 'This will take a few seconds',
  redirecting: 'Redirecting...',
  pleaseWait: 'Please wait',
  
  
  testCompletedTitle: 'Test Completed',
  testCompletedMessage: 'Thank you for completing the test! Your responses have been recorded.',
  
  
  testInfoTitle: 'Test Information',
  testInfoGreeting: 'Hello',
  testInfoPurposeTitle: 'Test Purpose',
  testInfoPurposeText: 'This test is designed to evaluate your professional skills and knowledge. The results will help us better understand your strengths and areas for development.',
  testInfoConditionsTitle: 'Test Conditions',
  testInfoDuration: 'Test duration: 40 minutes',
  testInfoQuestions: 'Number of questions: 30',
  testInfoPassScore: 'Minimum passing score: 70%',
  testInfoNavigation: 'Ability to return to previous questions',
  testInfoRulesTitle: 'Test Rules',
  testInfoRule1: '1. Ensure you have a stable internet connection',
  testInfoRule2: '2. Do not use external materials or help from others',
  testInfoRule3: '3. Answer the questions independently and honestly',
  testInfoRule4: '4. Contact the administrator if you encounter technical issues',
  testInfoStartTest: 'Start Test',
  
  
  loading: 'Loading data...',
  
  
  errorTitle: 'Loading Error',
  errorReturnForm: 'Return to form',

  
  candidateForm: {
    title: 'Candidate Application',
    description: 'Please fill out the form carefully.',
    submitButton: 'Submit and Proceed to Test',
    
    fields: {
      firstName: 'First Name',
      telegramTag: 'Telegram Tag (@username)',
      shift: 'Preferred Shift',
      experience: 'Work Experience',
      motivation: 'Why do you want to work with us?',
      aboutMe: 'Tell us about yourself'
    },
    shifts: {
      morning: 'Morning (0-8 UTC)',
      day: 'Day (8-16 UTC)',
      night: 'Night (16-0 UTC)',
      flexible: 'Flexible'
    },
     experienceLevels: {
      none: 'No experience',
      lessThanYear: 'Less than 1 year',
      oneToThreeYears: '1-3 years',
      moreThanThreeYears: 'More than 3 years'
    },
    validation: {
      firstNameRequired: 'First name is required.',
      telegramTagRequired: 'Telegram tag is required.',
      telegramTagInvalid: 'Telegram tag must start with @ and contain at least 5 characters.',
      shiftRequired: 'Please select your preferred shift.',
      experienceRequired: 'Please select your work experience.',
      motivationRequired: 'Please describe your motivation.',
      aboutMeRequired: 'Please tell us about yourself.',
    },
    errors: {
      missingToken: 'Access token is missing. Please check the link you received.',
      invalidToken: 'Invalid or expired access token. Please request a new link.',
      tokenUsed: 'This access token has already been used. If you filled out the form earlier, proceed to the test information. Otherwise, please request a new link.',
      tokenExpired: 'The token has expired. Please request a new link for access.',
      validationError: 'An error occurred during token validation. Please try refreshing the page.',
      noEmployeeId: 'Could not identify your session. Please refresh the page or use a valid link.',
      submitError: 'Error submitting the form. Please check your information and try again.',
      submitErrorUnknown: 'An unknown error occurred while submitting the form. Please try again later.'
    }
  }
};


export default en; 