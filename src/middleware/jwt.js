const jose = require("node-jose");

const APP_CLIENT_ID = "794av1dhkdkcg0ccc31ii2n915";
// https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_CWsGBCvuo/.well-known/jwks.json
const KEYS = JSON.parse(
  `{"keys":[{"alg":"RS256","e":"AQAB","kid":"BbuztA+7Q2lKHJSsNNKgnTFwTJ1CuDcf6Is47NxNvCo=","kty":"RSA","n":"0qxzzxO6yRB_hRQPBVAvVco2vzR1wCEcI9sgcDh4EtopCZhNUH2I-WRJ10okJuYiYrIYR6AQ3n-8_Q8NLLJxXlHxd5cCXxYGTWb93rSDcxDq35-sQ44IPolOllBh-NkKSDwhpCRZS1nivJ8LiwS_v6uMVgwuekQm0imJeScI8jyklhqLwyfImP2_h-xMhEr784EW-Ui5KD_r-atxzhYTRBC_KuvGgd1A5ieBrZWHmDJUsYn1tSpThJCAtxe_SIN4t0Us6bFGCNBv5Cc_WL85MGh8YszyVJgn5MdUOtR3oVv5-IodJbVkiLrTeN7Vhe_iooRSwK_EEXFSHg-2UeMPLw","use":"sig"},{"alg":"RS256","e":"AQAB","kid":"bxTqosUV1J7Qf5bFAFi5F2zfA1/MyJOMfoGtomfigJ8=","kty":"RSA","n":"gnCZosxJfML0ItadzABMVjwjQ9fgMcCgC8o4CQ9pfshmJx5doT2na1g3SAVf7XvOK2w_gKfoaqLvbfHu_iIrGHWQFy1H3NmAqyI7W4iWyfLSVUAQasc7DayXq2u8g4poTFaOucvYvCWcBXOh3Emj9COr_Ew_ov_l0QjPc6oR4-O_6x1kY-S5_ge2-d9hgHTqrkrUypyZGDDTQQq2_ODVvZd-ELaUNrsRLAWG3D0eHbVLJC8VgK3YLaI9uGT_Tyjo3fsMwvZYYVHfckG2_Ta8pnHsewQ3VMj0a4yAo_LpmvgGdVQKSdSB19gRAXdNdrhl6onHcYAWJd7hv4LogRKv9w","use":"sig"}]}`
)["keys"];
const ISSUER =
  "https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_CWsGBCvuo";
const AUTH_HEADER = "authorization";

module.exports = (req, res, next) => {
  if (!req.headers[AUTH_HEADER]) {
    res.sendStatus(401);
    return;
  }

  const parts = req.headers[AUTH_HEADER].split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    const token = parts[1];
    const sections = token.split(".");
    // get the kid from the headers prior to verification
    let header = jose.util.base64url.decode(sections[0]);
    header = JSON.parse(header);
    const kid = header.kid;
    // search for the kid in the downloaded public keys
    const key = KEYS.find(k => k.kid === kid);
    if (!key) {
      res.sendStatus(401);
      return;
    }

    // construct the public key
    jose.JWK.asKey(key).then(result => {
      // verify the signature
      jose.JWS.createVerify(result)
        .verify(token)
        .then(result => {
          // now we can use the claims
          const claims = JSON.parse(result.payload);
          // additionally we can verify the token expiration
          const currentTimestamp = Math.floor(new Date() / 1000);
          if (currentTimestamp > claims.exp) {
            // token expired
            res.sendStatus(401);
            return;
          }
          // and the Audience (use claims.client_id if verifying an access token)
          if (claims.aud !== APP_CLIENT_ID) {
            // token was not issued for this audience
            res.sendStatus(401);
            return;
          }

          // and the issuer matches too
          if (claims.iss !== ISSUER) {
            res.sendStatus(401);
            return;
          }

          req.claims = claims;

          // extract useful claims
          req.identity = {
            userId: claims.sub,
            email: claims.email,
            picture: claims.picture,
            name: claims.name
          };

          next();
        })
        .catch(() => {
          // Signature verification failed
          res.sendStatus(401);
        });
    });
  }
};
