// config/passport.js
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const { User, Role, Department, Location } = require("../models");

// Ambil token dari cookie 'jwt'
const cookieExtractor = (req) => (req?.cookies?.jwt ? req.cookies.jwt : null);

const opts = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    cookieExtractor,
    ExtractJwt.fromAuthHeaderAsBearerToken(),
  ]),
  secretOrKey: process.env.JWT_SECRET,
};

module.exports = (passport) => {
  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        const user = await User.findByPk(jwt_payload.id, {
          include: [
            { model: Role, as: "role", attributes: ["id", "name"] },
            {
              model: Department,
              as: "department",
              attributes: ["id", "name", "location_id"],
              include: [
                { model: Location, as: "location", attributes: ["id", "name"] },
              ],
            },
          ],
        });
        if (!user) return done(null, false);

        if (!user.roleName && user.role?.name) user.roleName = user.role.name;

        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    })
  );
};
