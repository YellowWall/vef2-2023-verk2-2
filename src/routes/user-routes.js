import express from 'express';
import { body,validationResult } from 'express-validator';
import { createUser, findByUsername } from '../lib/users.js';
import passport from '../lib/login.js';

export const userRouter = express.Router();

function login(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }

  let message = '';

  // Athugum hvort einhver skilaboð séu til í session, ef svo er birtum þau
  // og hreinsum skilaboð
  if (req.session.messages && req.session.messages.length > 0) {
    message = req.session.messages.join(', ');
    req.session.messages = [];
  }

  return res.render('login', { message, title: 'Innskráning' });
}

userRouter.get('/login', login);
userRouter.post(
  '/login',

  // Þetta notar strat að ofan til að skrá notanda inn
  passport.authenticate('local', {
    failureMessage: 'Notandanafn eða lykilorð vitlaust.',
    failureRedirect: '/login',
  }),

  // Ef við komumst hingað var notandi skráður inn, senda á index
  (req, res) => {
    res.redirect('/');
  }
);

userRouter.get('/logout', (req, res) => {
  // logout hendir session cookie og session
  req.session.destroy();
  res.redirect('/');
});


async function registerGet(req,res) {
  if (req.isAuthenticated()){
      return res.redirect('/');
  }
  return res.render('register', {
      title: 'Nýskráning - viðburðasíðan',
      data: {},
      errors: [],
  })
}
const registerValidation = [
  body('username')
      .isLength({min:1,max:64})
      .withMessage('Skrá verður notendanafn, hámark 64 stafir.'),
  body('name')
      .isLength({min:1,max:64})
      .withMessage('Skrá verður nafn, hámark 64 stafir'),
  body('password')
      .isLength({min:10,max:256})
      .withMessage('Skrá verður lykilorð, lágmark 10 stafir'),
  body('username').custom(async (username) => {
      const user = await findByUsername(username);
      if(user){
          return Promise.reject(new Error('Notendanafn er þegar skráð.'))
      }
      return Promise.resolve();
  }),
];
async function validationCheck(req,res,next){
  const {name,username,password} = req.body;
  const validation = validationResult(req);
  let error = [];
  if(!validation.isEmpty()){
    error = validation.array();
    res.render('register',{title: 'Nýskráning',errors: error,});
    return;
  };
  await createUser(name,username,password);
  res.redirect('/login');
  
  
  
};
userRouter.get('/register', registerValidation, (req, res) => {
  registerGet(req,res);
  // res.render('register', { title: 'Nýskráning' });
});

userRouter.post('/register', registerValidation, (req, res) => {
  validationCheck(req,res);
  // if(err.length > 0){
  // res.render('register', { title: 'Nýskráning', errors: err});
  // };
});