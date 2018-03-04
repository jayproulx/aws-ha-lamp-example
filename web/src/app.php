<?php

ini_set('display_errors', 'On');
error_reporting(E_ALL);

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/db-connect.php';

use Silex\Application;
use Silex\Provider\TwigServiceProvider;
use Symfony\Component\HttpFoundation\Request;
use Aws\S3\S3Client;
use Aws\Exception\AwsException;
use Aws\Exception\CredentialsException;

//Create a S3Client
$s3Client = new S3Client([
    'region' => 'us-east-1',
    'version' => '2006-03-01'//,
//    'debug' => true
]);

// Setup the application
$app = new Application();
$app->register(new TwigServiceProvider, array(
    'twig.path' => __DIR__ . '/templates',
));

// Setup the database
$app['db.table'] = DB_TABLE;
$app['db.dsn'] = 'mysql:dbname=' . DB_NAME . ';host=' . DB_HOST;
$app['db'] = $app->share(function ($app) {
    return new PDO($app['db.dsn'], DB_USER, DB_PASSWORD);
});

// Handle the index page
$app->match('/', function () use ($app, $s3Client) {
    $query = $app['db']->prepare("SELECT message, author FROM {$app['db.table']}");
    $thoughts = $query->execute() ? $query->fetchAll(PDO::FETCH_ASSOC) : array();
    $assets = [];

    try {
        $fetched = $s3Client->listObjectsV2([
            'Bucket' => ASSET_BUCKET,
            'Prefix' => ASSET_PREFIX
        ]);

        // remove entries that end in /, we only want objects not folders
        foreach( $fetched['Contents'] as $asset ) {
            if(preg_match("/[^\/]$/", $asset['Key'])) {
                array_push($assets, $asset);
            }
        }
    } catch (AwsException $awse) {
        echo "<pre>" . $awse . "</pre>";
    } catch (CredentialsException $ce) {
        echo "<pre>";
        var_dump($ce);
        echo "</pre>";
    }

    return $app['twig']->render('index.twig', array(
        'title' => 'Your Thoughts',
        'thoughts' => $thoughts,
        'instance' => file_get_contents("http://169.254.169.254/latest/meta-data/instance-id"),
        'assets' => $assets,
        'assetPrefix' => ASSET_PREFIX
    ));
});

// Handle the add page
$app->match('/add', function (Request $request) use ($app) {
    $alert = null;
    // If the form was submitted, process the input
    if ('POST' == $request->getMethod()) {
        try {
            // Make sure the photo was uploaded without error
            $message = $request->request->get('thoughtMessage');
            $author = $request->request->get('thoughtAuthor');
            if ($message && $author && strlen($author) < 64) {
                // Save the thought record to the database
                $sql = "INSERT INTO {$app['db.table']} (message, author) VALUES (:message, :author)";
                $query = $app['db']->prepare($sql);
                $data = array(
                    ':message' => $message,
                    ':author' => $author,
                );
                if (!$query->execute($data)) {
                    throw new \RuntimeException('Saving your thought to the database failed.');
                }
            } else {
                throw new \InvalidArgumentException('Sorry, The format of your thought was not valid.');
            }

            // Display a success message
            $alert = array('type' => 'success', 'message' => 'Thank you for sharing your thought.');
        } catch (Exception $e) {
            // Display an error message
            $alert = array('type' => 'error', 'message' => $e->getMessage());
        }
    }

    return $app['twig']->render('add.twig', array(
        'title' => 'Share Your Thought!',
        'alert' => $alert,
    ));
});

$app->run();
