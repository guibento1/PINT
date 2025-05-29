curl -s --user 'api:9e93c51743f99e2b17c1fa713f372e7b-7c5e3295-ad798b1d' \
  https://api.mailgun.net/v3/sandboxbad4945e3dec4632bfa70e32c94858d1.mailgun.org/messages \
  -F from='Mailgun Sandbox <postmaster@sandboxbad4945e3dec4632bfa70e32c94858d1.mailgun.org>' \
  -F to='Ruben Moreira <tiago.portugal@tutanota.com>' \
  -F subject='Hello Ruben Moreira' \
  -F text='Congratulations Ruben Moreira, you just sent an email with Mailgun! You are truly awesome!' \
