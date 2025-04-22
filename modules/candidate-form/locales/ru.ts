export const ru = {
  
  send: 'Отправить',
  cancel: 'Отмена',
  confirm: 'Подтвердить',
  price: 'Цена',
  free: 'БЕСПЛАТНО',
  photo: 'Фото',
  comment: 'Комментарий',
  message: 'Сообщение',
  online: 'Онлайн',
  away: 'Не в сети',
  typing: 'печатает...',
  you: 'Вы',
  
  
  enterMessage: 'Введите сообщение...',
  addPhotoComment: 'Добавьте комментарий к фото...',
  readyPhotos: 'Готовые фото',
  photoPrice: 'Цена фото',
  customPrice: 'Своя цена',
  photoComment: 'Комментарий к фото',
  bought: 'Куплено',
  notBought: 'Не куплено',
  
  
  passionateClient: 'Страстный клиент',
  capriciousClient: 'Капризный клиент',
  bargainingClient: 'Торгуется о цене',
  testingBoundaries: 'Проверяет границы',
  
  
  errorSendingMessage: 'Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте еще раз.',
  errorSendingPhoto: 'Произошла ошибка при отправке фото. Пожалуйста, попробуйте еще раз.',
  sessionNotFound: 'Тестовая сессия не найдена. Пожалуйста, перезагрузите страницу.',
  
  
  chat: {
    timeExpired: 'Время истекло. Отправка сообщений невозможна.'
  },
  
  
  selectPhotoPrice: 'Выберите цену фото',
  confirmSendPhoto: 'Отправить фото',
  
  
  congratulations: 'Поздравляем!',
  testCompletedSuccessfully: 'Вы успешно завершили тестирование коммуникативных навыков.',
  calculatingResults: 'Подсчитываем результаты...',
  itWillTakeSeconds: 'Это займет несколько секунд',
  redirecting: 'Перенаправление...',
  pleaseWait: 'Пожалуйста, подождите',
  
  
  testCompletedTitle: 'Тестирование завершено',
  testCompletedMessage: 'Благодарим за прохождение тестирования! Ваши ответы записаны.',
  
  
  testInfoTitle: 'Информация о тестировании',
  testInfoGreeting: 'Здравствуйте',
  testInfoPurposeTitle: 'Цель тестирования',
  testInfoPurposeText: 'Данное тестирование предназначено для оценки ваших профессиональных навыков и знаний. Результаты помогут нам лучше понять ваши сильные стороны и области для развития.',
  testInfoConditionsTitle: 'Условия тестирования',
  testInfoDuration: 'Продолжительность теста: 40 минут',
  testInfoQuestions: 'Количество вопросов: 30',
  testInfoPassScore: 'Минимальный проходной балл: 70%',
  testInfoNavigation: 'Возможность вернуться к предыдущим вопросам',
  testInfoRulesTitle: 'Правила тестирования',
  testInfoRule1: '1. Убедитесь, что у вас стабильное интернет-соединение',
  testInfoRule2: '2. Не используйте сторонние материалы или помощь других людей',
  testInfoRule3: '3. Отвечайте на вопросы самостоятельно и честно',
  testInfoRule4: '4. При технических проблемах обратитесь к администратору',
  testInfoStartTest: 'Начать тест',
  
  
  loading: 'Загрузка данных...',
  
  
  errorTitle: 'Ошибка загрузки',
  errorReturnForm: 'Вернуться к форме',

  
  candidateForm: {
    title: 'Анкета соискателя',
    description: 'Пожалуйста, внимательно заполните анкету.',
    submitButton: 'Отправить и перейти к тесту',
    
    fields: {
      firstName: 'Имя',
      telegramTag: 'Тег Telegram (@username)',
      shift: 'Предпочитаемая смена',
      experience: 'Опыт работы',
      motivation: 'Почему вы хотите работать у нас?',
      aboutMe: 'Расскажите о себе'
    },
    shifts: {
      morning: 'Утро (0-8 UTC)',
      day: 'День (8-16 UTC)',
      night: 'Ночь (16-0 UTC)',
      flexible: 'Гибкий график'
    },
    experienceLevels: {
      none: 'Нет опыта',
      lessThanYear: 'Менее 1 года',
      oneToThreeYears: '1-3 года',
      moreThanThreeYears: 'Более 3 лет'
    },
    validation: {
      firstNameRequired: 'Имя обязательно для заполнения.',
      telegramTagRequired: 'Тег Telegram обязателен для заполнения.',
      telegramTagInvalid: 'Тег Telegram должен начинаться с @ и содержать минимум 5 символов.',
      shiftRequired: 'Пожалуйста, выберите предпочитаемую смену.',
      experienceRequired: 'Пожалуйста, выберите ваш опыт работы.',
      motivationRequired: 'Пожалуйста, опишите вашу мотивацию.',
      aboutMeRequired: 'Пожалуйста, расскажите немного о себе.',
    },
    errors: {
      missingToken: 'Отсутствует токен доступа. Пожалуйста, проверьте полученную ссылку.',
      invalidToken: 'Недействительный или просроченный токен доступа. Пожалуйста, запросите новую ссылку.',
      tokenUsed: 'Этот токен доступа уже был использован. Если вы заполнили форму ранее, перейдите к информации о тесте. В противном случае, запросите новую ссылку.',
      tokenExpired: 'Срок действия токена истек. Пожалуйста, запросите новую ссылку для доступа.',
      validationError: 'Произошла ошибка при проверке токена. Попробуйте обновить страницу.',
      noEmployeeId: 'Не удалось определить вашу сессию. Пожалуйста, обновите страницу или используйте действительную ссылку.',
      submitError: 'Ошибка при отправке формы. Пожалуйста, проверьте введенную информацию и повторите попытку.',
      submitErrorUnknown: 'Произошла неизвестная ошибка при отправке формы. Пожалуйста, повторите попытку позже.'
    }
  }
};

export default ru; 