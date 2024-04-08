const express = require('express');
const bodyParser = require('body-parser');
// const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pool = require('./db');
router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

const fileUpload = require('express-fileupload');
router.use(fileUpload()); //FIle upload?

router.get('/', async (req, res) => {
  res.redirect('/birds')
});

// Create Birds Page Router
router.get('/birds/create', async (req, res) => {
  conservation_status_data = []
  res.render('create', {
    title: 'Birds of Aotearoa',
    status: conservation_status_data
  });
});


// Delete Bird Final Act
router.get('/birds/:id/delete', async (req, res) => {
  const id = req.params.id;
  const db = await pool.promise();
  // Delete the photos of bird
  const deletePhotosQuery = `DELETE FROM Photos WHERE bird_id = ?;`;
  await db.query(deletePhotosQuery, [id]);
  // Delete the bird from db
  const deleteBirdQuery = `DELETE FROM Bird WHERE bird_id = ?;`;
  await db.query(deleteBirdQuery, [id]);
  // Go back to home page

  res.redirect('/birds');
});

//Delete Bird Check option
router.get('/birds/:id/checkDelete', async (req, res) => {
  const id = req.params.id;
  console.log(id);
  const db = await pool.promise();
  // const birds_query = `SELECT * FROM Bird, Photos , ConservationStatus WHERE Bird.bird_id = ${id} AND Photos.bird_id = ${id} AND    ConservationStatus.status_id=Bird.status_id;`
  const birds_query = `SELECT * FROM Bird, Photos , ConservationStatus WHERE Bird.bird_id = ? AND Photos.bird_id = ? AND    ConservationStatus.status_id=Bird.status_id;`

  const [rows] = await db.query(birds_query, [id,id]);
  const bird = rows[0]; //
  // 1 bird oer row check
  console.log(bird);
  console.log(id);
  res.render('delete', { bird: bird });
});




// router.get('/public/images/:image', async (req, res) => {
//     res.sendFile(__dirname + '/public/images/' + req.params.image);
// });

// Display All birds
router.get('/birds', async (req, res) => {
  conservation_status_data = [];
  birds = [];
  photos = [];
  /* conservation status from mysql */
  const db = pool.promise();


  try {
    const status_query = `SELECT * FROM ConservationStatus;`
    const [rows, fields] = await db.query(status_query);
    conservation_status_data = rows;
  } catch (err) {
    console.error("You havent set up the database yet!");
  }

  /* REPLACE THE .json WITH A MYSQL DATABASE */
  //const birds = require('./sql/nzbird.json');
  const birds_query = `SELECT * FROM
 Photos, Bird, ConservationStatus WHERE
  Photos.bird_id=Bird.bird_id AND
   ConservationStatus.status_id=Bird.status_id;`

  console.log(birds_query);  // const birds_query = `SELECT * from Birds;`
  try {
    const [rows, ] = await db.query(birds_query);
    birds = rows;
  } catch (err) {
    console.error("You havent set up the birds database yet!");
  }
  res.render('index', {
    title: 'Birds of Aotearoa',
    birds: birds,
    // photos: photos,
    status: conservation_status_data
  });

});



router.get('/birds/:id', async (req, res) => {
  const id = req.params.id;
  console.log(id);
  const db = pool.promise();
  birds = [];
  conservation_status_data = [];
  // const birdsQuery = `SELECT * FROM Bird, Photos , ConservationStatus WHERE Bird.bird_id = ${id} AND Photos.bird_id = ${id} AND    ConservationStatus.status_id=Bird.status_id;`
  const birdsQuery = `SELECT * FROM Bird, Photos , ConservationStatus WHERE Bird.bird_id = ? AND Photos.bird_id = ? AND    ConservationStatus.status_id=Bird.status_id;`

  try {
    const [queryForBird, fields] = await db.query(birdsQuery,[id,id]);
    birds = queryForBird;

    res.render('soloBird', {
      title: 'Birds of Aotearoa' + birds[0].name,
      birds: birds,
      status: conservation_status_data
    });

  } catch (err) {
    console.error("You havent set up the database for birds yet!");
  }

});


// const getStatusIdQuery = 'SELECT status_id FROM ConservationStatus WHERE status_name = ?';
// const [statusRow] = await db.query(getStatusIdQuery, [req.body.status_name]);
// const newStatusId = statusRow[0].status_id;
// bird[0].status_id = newStatusId;

router.get('/birds/:id/update', async (req, res) => {
  const id = req.params.id;
  const db = pool.promise();
  const status = [];

  try {
    // Fetch the bird data based on the provided ID
    // const birdsQuery = `SELECT * FROM Bird, Photos , ConservationStatus 
    // WHERE Bird.bird_id = ${id} AND Photos.bird_id = ${id} AND 
    //  ConservationStatus.status_id= Bird.status_id;`

     const birdsQuery = `SELECT Bird.*, Photos.*, ConservationStatus.status_name
     FROM Bird
     JOIN Photos ON Bird.bird_id = Photos.bird_id
     JOIN ConservationStatus ON Bird.status_id = ConservationStatus.status_id
     WHERE Bird.bird_id = ?;`;

    const [bird] = await db.query(birdsQuery, [id]);

    if (bird.length === 0) {
      // Bird with the given ID does not exist
      return res.status(404).send('Bird not found');
    }


 // THis is the path to the post functions
    res.render('edit', {
      title: 'Edit Bird',
      birds: bird[0],
      status: status
    });
  } catch (err) {
    console.error('Error fetching bird data:', err);
    res.status(500).send('Internal server error');
  }
});



router.post('/birds/edit/:id', async (req, res) => {
  let photo_upload; 
  const id = req.params.id;
  const db = pool.promise();
  let bird = {
    primary_name: req.body.primary_name,
    english_name: req.body.english_name,
    scientific_name: req.body.scientific_name,
    order_name: req.body.order_name,
    family: req.body.family,
    length: req.body.length,
    weight: req.body.weight,
    status_name: req.body.status_name,
    photographer: req.body.photographer,
    // photo_upload: req.files.photo_upload
  };
  //try {
console.log(bird);

//
if (req.files && req.files.photo_upload) {
  let photo_upload = req.files.photo_upload;
  const uniqueFilename = Date.now() + '_' + photo_upload.name;
  const uploadPath = __dirname + '/public/images/' + uniqueFilename;
  // Use the mv() method to save the new photo on the server
  photo_upload.mv(uploadPath, function (err) {
    if (err) {
      return res.status(500).send(err);
    }
  });
  // Update the photo information in the database
  const updatePhotoQuery = 'UPDATE Photos SET filename = ?, photographer = ? WHERE bird_id = ?';
  await db.query(updatePhotoQuery, [photo_upload.name, bird.photographer, id]);
}



try{
const getStatusId = 'SELECT status_id FROM ConservationStatus WHERE status_name LIKE ?';
console.log("Get Status Id is" + getStatusId);
console.log("Status name is "   + bird.status_name);
const [statusRow] = await db.query(getStatusId, [bird.status_name]);
console.log("Status Row" + statusRow[0]);

const newStatusId = statusRow[0].status_id;


  const birdSQL = `UPDATE Bird SET primary_name = ?, english_name = ?, scientific_name = ?, order_name = ?, family = ?, length = ?, weight = ? ,status_id =? WHERE bird_id = ?;`;
   await db.query(birdSQL, [bird.primary_name, bird.english_name, bird.scientific_name, bird.order_name, bird.family, bird.length, bird.weight, newStatusId , id]);

  }catch(err){
    console.error('Error editing bird data:', err);
    res.status(500).send('Internal server error');
  }
  // const photoSQL = `UPDATE Photos SET filename = ?, photographer = ? WHERE bird_id = ?;`;
  // const [rows2] = await db.query(photoSQL, [bird.photo_upload, bird.photographer, id]);


  //updates SQL?
  // const statusSQL = `UPDATE ConservationStatus SET status_name = ? WHERE status_id = ?;`;
  //  await db.query(statusSQL, [bird.status_name, id]);


  res.redirect('/birds');



});






router.post('/birds/create', async function (req, res) {
  let uploadPath;
  const db = pool.promise();

  // Testing without file upload
  if (!req.files || Object.keys(req.files).length === 0) {

    return res.status(400).send('No files were uploaded.');
  }
  //  ## FROM npmjs.com/package/express-fileupload ##
  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  photo_upload = req.files.photo_upload;
  const uniqueFilename = Date.now() + '_' + photo_upload.name;

  uploadPath = __dirname + '/public/images/' + uniqueFilename;
  // Use the mv() method to place the file somewhere on your server
  photo_upload.mv(uploadPath, function (err) {
    if (err)
      return res.status(500).send(err);
  });
  let bird = {
    primary_name: req.body.primary_name,
    english_name: req.body.english_name,
    scientific_name: req.body.scientific_name,
    order_name: req.body.order_name,
    family: req.body.family,
    length: req.body.length,
    weight: req.body.weight,
    status_name: req.body.status_name,
    photographer: req.body.photographer,
  };

  console.log(bird);

  try {
    //NEE BIRD ID LAST INSERT ID

    // const statusNamePattern = '%bird.status_name%';


    const getStatusId = 'SELECT status_id FROM ConservationStatus WHERE status_name LIKE ?';
    console.log("Get Status Id is" + getStatusId);
    console.log("Status name is "   + bird.status_name);
    const [statusRow] = await db.query(getStatusId, [bird.status_name]);
    const newStatusId = statusRow[0].status_id;

    console.log("Status ID is " + newStatusId);
    console.log("Status Row is " + statusRow);

    const insertBirdQuery = `INSERT INTO Bird (primary_name, english_name, scientific_name, order_name, family, length, weight, status_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    await db.query(insertBirdQuery, [bird.primary_name, bird.english_name, bird.scientific_name, bird.order_name, bird.family, bird.length, bird.weight, newStatusId]);
  } catch (err) {
    return res.status(500).send(err); // Use return to exit the handler
  }

  // const birds_query = `SELECT * FROM
  // Photos, Bird, ConservationStatus WHERE
  //  Photos.bird_id=Bird.bird_id AND
  //   ConservationStatus.status_id=Bird.status_id;`;
 
  //  const [updatedBirdsList] = await db.query(birds_query);
  //  birds1 = updatedBirdsList;

   
  //   FOR RENDERING

    // const status_query = `SELECT * FROM ConservationStatus;`
    // const [rows] = await db.query(status_query);
    // conservation_status_data = rows;

    const getStatusId = 'SELECT status_id FROM ConservationStatus WHERE status_name = ?';
    console.log(getStatusId);

    const [statusRow] = await db.query(getStatusId, [bird.status_name]);
    console.log(statusRow);
    const newStatusId = statusRow[0].status_id;
    console.log(newStatusId);

    //Finding bird id so we can add photo
    const getCurrBirdId = 'SELECT bird_id FROM Bird WHERE primary_name = ? AND english_name = ? AND scientific_name = ? AND order_name = ? AND family = ? AND length = ? AND weight = ? AND status_id = ?';
    const [birdRow] = await db.query(getCurrBirdId, [bird.primary_name, bird.english_name, bird.scientific_name, bird.order_name, bird.family, bird.length, bird.weight, newStatusId]);
    const currBirdId = birdRow[0].bird_id;
    console.log("hello");
    console.log(currBirdId);
    console.log("hello");
  
    // const birdsQuery = `SELECT * FROM Bird, Photos , ConservationStatus WHERE Bird.bird_id = ?  AND Photos.bird_id = ? AND    ConservationStatus.status_id=Bird.status_id;`
    // const currBird = [];
    // console.log(birdsQuery);
    // const [queryForBird] = await db.query(birdsQuery,[currBirdId,currBirdId]);
    // console.log(queryForBird);
    //   currBird = queryForBird;

    if (photo_upload.name) {
      // const lastInsertId = await db.query('SELECT LAST_INSERT_ID()');
      // const birdId = lastInsertId[0][0]['LAST_INSERT_ID()'];
  
      const insertPhotoQuery = 'INSERT INTO photos (bird_id, filename, photographer) VALUES (?, ?, ?)';
      await db.query(insertPhotoQuery, [currBirdId,photo_upload.name, bird.photographer]);
    }

    res.redirect('/birds');
 
  //  res.render('index', {
  //    title: 'Birds of Aotearoa',
  //    birds: birds1,
  //    status: conservation_status_data
  //  });

  // res.render('soloBird', {
  //   title: 'Birds of Aotearoa',
  //   birds: currBird[0],
  //   status: conservation_status_data
  // });


  // Insert the new bird's photo data into the photos table

  // Testing without file upload







});





module.exports = router;