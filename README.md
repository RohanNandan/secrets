# secrets
It is a website where the users can share / view secrets.
Built this website mainly to focus on various authentication techniques.
Used
  mongoose-encrypt package,
  passport,
  oauth2.0

The user has to register/login to submit a secret, but can view anyone's secret without having to login or register.
The user info along with his secret submitted is stored in MongoDB, but if he logs in using google, only his google ID is stored along with the secret
