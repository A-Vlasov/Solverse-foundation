export const en = {
  // Common
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
  
  // Chat interface
  enterMessage: 'Enter message...',
  addPhotoComment: 'Add a comment to photo...',
  readyPhotos: 'Ready Photos',
  photoPrice: 'Photo Price',
  customPrice: 'Custom Price',
  photoComment: 'Photo Comment',
  bought: 'Bought',
  notBought: 'Not Bought',
  
  // Chat descriptions
  passionateClient: 'Passionate client',
  capriciousClient: 'Capricious client',
  bargainingClient: 'Bargaining about price',
  testingBoundaries: 'Testing boundaries',
  
  // Errors
  errorSendingMessage: 'An error occurred while sending the message. Please try again.',
  errorSendingPhoto: 'An error occurred while sending the photo. Please try again.',
  sessionNotFound: 'Test session not found. Please reload the page.',
  
  // Chat
  chat: {
    timeExpired: 'Time expired. Message sending is disabled.'
  },
  
  // Dialogs
  selectPhotoPrice: 'Select Photo Price',
  confirmSendPhoto: 'Send Photo',
  
  // Test completion
  congratulations: 'Congratulations!',
  testCompletedSuccessfully: 'You have successfully completed the communication skills test.',
  calculatingResults: 'Calculating results...',
  itWillTakeSeconds: 'This will take a few seconds',
  redirecting: 'Redirecting...',
  pleaseWait: 'Please wait',
  
  // Test completed page
  testCompletedTitle: 'Test Completed',
  testCompletedMessage: 'Thank you for completing the test! Your responses have been recorded.',
  
  // Test Information
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
  
  // Loading
  loading: 'Loading data...',
  
  // Error
  errorTitle: 'Loading Error',
  errorReturnForm: 'Return to form',

  candidateForm: {
    title: 'Candidate Application',
    subtitle: 'Please fill in all the fields',
    tryAgain: 'Try Again',
    submit: 'Submit Application',
    submitting: 'Saving...',
    goToTestInfo: 'Go to Test Information',
    errorTitle: 'Access Error',
    accessError: 'Access Error',
    loading: 'Checking access...',
    fields: {
      name: 'Name',
      telegram: 'Telegram Tag',
      shift: 'Shift',
      experience: 'Work Experience',
      motivation: 'Motivation',
      aboutMe: 'Tell us about yourself'
    },
    shifts: {
      night: '#night 0-8',
      day: '#day 8-16',
      evening: '#evening 16-0'
    },
    errors: {
      missingToken: 'Access token is missing. Please check the link you received.',
      invalidToken: 'Invalid or expired access token. Please request a new link.',
      unexpectedError: 'An unexpected error occurred. Please try again later.',
      missingEmployeeId: 'Could not determine your ID. Please refresh the page and try again.',
      submissionError: 'Error submitting the form. Please check your information and try again.',
      tokenAlreadyUsed: 'This access token has already been used. If you filled out the form earlier, proceed to the test information. Otherwise, please request a new link.',
      tokenExpired: 'The token has expired. Please request a new link for access.',
      requiredField: 'This field is required',
      telegramFormat: 'Telegram tag must start with @',
      selectShift: 'Please select a shift'
    }
  }
};

export default en; 