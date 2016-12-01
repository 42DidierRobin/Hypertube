/**
 * Created by rdidier on 11/21/16.
 */

module.exports = {

    'facebook' : {
        input_token  : 'XXX',
        fields : 'last_name,first_name,picture'
    },
    'ecole42' : {
        client_id: 'XXX',
        client_secret: 'XXX',
        grant_type: 'authorization_code',
        redirect_uri: 'http://XXX.XXX?from=Ecole42'
    },
    'github' : {
        client_id: 'XXX',
        client_secret: 'XXX',
        redirect_uri: 'http://XXX.XXX'
    },
    'slack' : {
        client_id: 'XXX',
        client_secret: 'XXX'
    },
    'linkedin' : {
        client_id: "XXX",
        client_secret: 'XXX',
        grant_type: 'authorization_code',
        redirect_uri: 'http://XXX.XXX?from=Linkedin'
    }
};

