/**
 * Created by rdidier on 10/5/16.
 */

var mailList = {
    "newUser": {
        subject: {
            en: "Welcome on Hypertube !",
            fr: "Bienvenue sur hypertube !"
        },
        text: {
            en: "Welcome on hypertube ! To be able to use completely our website," +
            " please confirm your mail with this link: ?",
            fr: "Bienvenue sur hypertube ! Pour pouvoir utiliser notre site completement," +
            "merci de bien vouloir confirmer votre email avec le lien suivant: ?"
        }
    },
    "newMail": {
        subject: {
            en: "Hypertube new mail confirmation",
            fr: "Confirmation du nouvel email Hypertube"
        },
        text: {
            en: "Because you just changed your email address, you have to confirm it to be able to use your account again" +
            ". Please follow this link : ?",
            fr: "Vous avez changez votre adresse email. Merci de bien vouloir suivre le lien suivant afin de pouvoir " +
            "réutiliser votre comte hypertube : ?"
        }
    },
    "newPass": {
        subject: {
            en: "Hypertube new password",
            fr: "Hypertube: nouveau mot de passe"
        },
        text: {
            en: "You just ask for a new password. Here it is : ?",
            fr: "Vous avez demandez une nouveau mot de passe, le voilà: ?"
        }
    }
};

generateHtmlMail = (subject, text) => {
    var final;
    final = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> \
                <html xmlns="http://www.w3.org/1999/xhtml"> \
                    <head> \
                        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\
                        <title>' + subject + '</title> \
                        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>\
                    </head> \
                </html> ';
    final += '<body bgcolor="#242529" style="margin: 0; padding: 0;"> \
                    <table cellpadding="0" cellspacing="0" width="100%" > \
                        <tr> \
                            <td align="center" bgcolor="#242529" style="padding: 40px 0 30px 0;"> \
                                <a href="http://' + host + '"> \
                                    <img src="http://' + host + '/img/logo.png" alt="Hypertube" width="300" height="230" style="display: block; height: 80px;" /> \
                                </a> \
                            </td> \
                        </tr> \
                        <tr> \
                            <td bgcolor="#242529" style="color: #ffffff; text-align: center"> \
                                ' + text + ' \
                            </td> \
                        </tr> \
                    </table> \
                </body>';

    return final
};

module.exports.sendMail = (key, data, cb) => {

    var lang = data.currentUser ? data.currentUser.lang : data.args.lang;
    var text = (mailList[key].text[lang]).replace('?', data.args.mailReplace.content);
    var textHtml = '';
    if (!data.args.mailReplace.link)
        textHtml = text;
    else {
        textHtml = (mailList[key].text[lang]).replace('?',
            '<a style="color: orangered" href="' + data.args.mailReplace.content + '">' + data.args.mailReplace.link + '</a');
    }
    require('./app.js').sendMail({
        to: data.args.email,
        subject: mailList[key].subject[lang],
        text: text,
        html: generateHtmlMail(mailList[key].subject[lang], textHtml)
    }, function (err) {
        cb(err)
    });
};