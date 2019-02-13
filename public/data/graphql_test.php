
<?php
require "graphqlPHP/autoload.php";
require "DB.php";
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Schema;
use GraphQL\GraphQL;

try {

    //database connection configuration
    $config = [
		'host' => '89.46.111.34',
		'database' => 'Sql1044625_2',
		'username' => 'Sql1044625',
		'password' => '1m5s33g7q5'
    ];

    //initialisation of database connection
	DB::init($config);

    //definition of the response types and structure GeoJSON
    $accidentsCount = new ObjectType([
        'name' => 'total',
        'fields' => [
            'year' => ['type' => Type::int()],
            'count' => [ 'type' => Type::int()],
        ]
    ]);
    
    $pointGeom = new ObjectType([
        'name' => 'geometry',
        'fields' => [
            'type' => ['type' => Type::string() ],
            'coordinates' => [ 'type' => Type::listOf(Type::float())],
        ]
    ]);
    
    $properties = new ObjectType([
       'name' => 'properties',
       'fields' => [
            'id' => ['type' => Type::string() ],
            'year' => [ 'type' => Type::int() ],
            'casualty_severity' => ['type' => Type::string()]
        ]
    ]);
    
    
    $featureType = new ObjectType([
        'name' => 'pointFeature',
        'fields' => [
            'type' => ['type' => Type::string() ],
            'geometry' => $pointGeom,
            'properties' => $properties
        ],
    ]);
    
    //function transforming a pair of x,y coords in a polygon WKT string
	function makeWKT($coords) {
        $x_min = $coords[0];
        $y_min = $coords[1];
        $x_max = $coords[2];
        $y_max = $coords[3];
        return "POLYGON((".$x_min. " " .$y_min. "," .$x_max. " " .$y_min. "," .$x_max. " ".$y_max.",".$x_min." " .$y_max. "," .$x_min. " " .$y_min. "))";
    }
    
    //maps the recevied text values (Slight, Fatal) to numbers (1,2) 
    function makeSeverity($severity_array) {
        if ($severity_array === null) {
            $severity = join(',' , range(1,3,1));
        } else {
            $severity_map = array(
                'fatal' => 1,
                'serious' => 2,
                'slight' => 3
            );
            foreach($severity_array as &$value) {
                $value = $severity_map[strtolower($value)];
            }
            unset($value);
            $severity = join(',' , $severity_array);
        }
        return $severity;
    }

    //builds a WKT bounding from the coords submitted with the user request
    function makeBBOX($geom_array) {
        if ($geom_array === null || count($geom_array) !== 4) {
            $BBOX = 'POLYGON((-180 -90, -180 90, 180 90, 180 -90, -180 -90))';
        } else {
            $BBOX = makeWKT($geom_array);
        }
        return $BBOX;
    }

	
	$queryType = new ObjectType([
    'name' => 'AccidentsData',
    'fields' => [
        'total' => [
            'type' => Type::listOf($accidentsCount),
            'args' => [
                'year' => Type::listOf(Type::int()),
                'severity' => Type::listOf(Type::string()),
                'geom' => Type::listOf(Type::float())
            ],
            'resolve' => function ($root, $args, $context) {
                $years = $args['year'] === null ? join(',' , range(2005,2017,1)) : join(',' , $args['year']);
                $severity = makeSeverity($args['severity']);
                $BBOX = makeBBOX($args['geom']);
                $results = DB::select("CALL get_acc_count('".$years."', '".$severity."', '".$BBOX."')");
               foreach($results as $row) {
                    $rows[] = array(
                    'year' => intval($row->year),
                    'count' => intval($row->total)
                    );
                }
                return $rows;
            }
        ],
        'accidents' => [
            'type' =>  Type::nonNull(Type::listOf($featureType)),
            'args' => [
                'year' => Type::listOf(Type::int()),
                'severity' => Type::listOf(Type::string()),
                'geom' => Type::listOf(Type::float())
            ],
            'resolve' => function ($root, $args, $context) {
                $years = $args['year'] === null ? join(',' , range(2005,2017,1)) : join(',' , $args['year']);
                $severity = makeSeverity($args['severity']);
                $BBOX = makeBBOX($args['geom']);
                $results = DB::select("CALL get_acc_info('".$years."', '".$severity."', '".$BBOX."')");
	            if(!empty($results)) {
               foreach($results as $row) {
                    $rows[] = array(
                    'type' => 'Feature',
                    'geometry' => array(
                        'type' => 'Point',
                        'coordinates' => array(
                           $row->x_world_mercator,
                            $row->y_world_mercator
                        )
                    ),
                    "properties" => array(
            			'id' => $row->id,
            			'year' => $row->year,
            			'casualty_severity'=> $row->casualty_severity,
            			)
                    );
                }
                return $rows;
	            } else {
                return array();
            }
            }
        ]
    ]
]);


    // See docs on schema options:
    // http://webonyx.github.io/graphql-php/type-system/schema/#configuration-options
    $schema = new Schema([
        'query' => $queryType
    ]);
    //takes the json input {"query":"query{echo(messge)}"}
    $rawInput = file_get_contents('php://input');
    //decodes the content as JSON
    $input = json_decode($rawInput, true);
    //takes the "query" property of the object
    $query = $input['query'];
    //checks if the input variables are a set
    $variableValues = isset($input['variables']) ? $input['variables'] : null;
    //calls the graphQL PHP libraty execute query with the prepared variables
    $result = GraphQL::executeQuery($schema, $query, null, null, $variableValues);
    //converts the result to a PHP array
    $output = $result->toArray();
} catch (\Exception $e) {
    $output = [
        'error' => [
            'message' => $e->getMessage()
        ]
    ];
}
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, X-Requested-With");
//encodes the result in a JSON object and responds
echo json_encode($output);