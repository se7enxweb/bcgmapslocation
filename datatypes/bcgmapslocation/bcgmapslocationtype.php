<?php
//
// Definition of BCGMapsLocationType Class
//
// SOFTWARE NAME: BC GMaps Location Class
// SOFTWARE RELEASE: 0.1.1
// COPYRIGHT NOTICE: Copyright (C) 2009 Brookins Consulting
// SOFTWARE LICENSE: GNU General Public License v2.0 (or later)
// NOTICE: >
//   This program is free software; you can redistribute it and/or
//   modify it under the terms of version 2.0 (or later) of the GNU General
//   Public License as published by the Free Software Foundation.
//
//   This program is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//   GNU General Public License for more details.
//
//   You should have received a copy of version 2.0 of the GNU General
//   Public License along with this program; if not, write to the Free
//   Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
//   MA 02110-1301, USA.
//
//

/*! \file bcgmapslocationtype.php
*/

/*!
  \class BCGMapsLocationType bcgmapslocationtype.php
  \ingroup eZDatatype
  \brief The class BCGMapsLocationType is like this guy ya know ...
*/

class BCGMapsLocationType extends eZDataType
{
    const DATA_TYPE_STRING = "bcgmapslocation";

    /*!
     Constructor
    */
    function __construct()
    {
        parent::__construct( self::DATA_TYPE_STRING, 
			   ezpI18n::tr( 'extension/bcgmapslocation/datatypes',
			   "GMaps Location", 'Datatype name' ),
                           array( 'serialize_supported' => true ) );
    }

    /*!
     Returns ...
    */
    function validateObjectAttributeHTTPInput( $http, $base, $contentObjectAttribute )
    {
        // the class attribute, for every branch below (PHP 8: an undefined variable is an error)
        $classAttribute = $contentObjectAttribute->contentClassAttribute();
        if ( $http->hasPostVariable( $base . '_data_bcgmapslocation_latitude_' . $contentObjectAttribute->attribute( 'id' ) ) and
             $http->hasPostVariable( $base . '_data_bcgmapslocation_longitude_' . $contentObjectAttribute->attribute( 'id' ) ) )
        {

            $latitude = $http->postVariable( $base . '_data_bcgmapslocation_latitude_' . $contentObjectAttribute->attribute( 'id' ) );
            $longitude = $http->postVariable( $base . '_data_bcgmapslocation_longitude_' . $contentObjectAttribute->attribute( 'id' ) );
            $classAttribute = $contentObjectAttribute->contentClassAttribute();
            if ( $latitude == '' or
                 $longitude == '' )
            {
                if ( !$classAttribute->attribute( 'is_information_collector' ) && $contentObjectAttribute->validateIsRequired() )
                {
                    $contentObjectAttribute->setValidationError( ezpI18n::tr( 'kernel/classes/datatypes',
                                                                         'Missing Latitude/Longitude input.' ) );
                    return eZInputValidator::STATE_INVALID;
                }
                else
                {
                    return eZInputValidator::STATE_ACCEPTED;
                }
            }
        }
        else if ( !$classAttribute->attribute( 'is_information_collector' ) && $contentObjectAttribute->validateIsRequired() )
        {
            return eZInputValidator::STATE_INVALID;

        }
        else
        {
            return eZInputValidator::STATE_ACCEPTED;
        }
    }

    /*!
     Returns ...
    */
    function fetchObjectAttributeHTTPInput( $http, $base, $contentObjectAttribute )
    {
        $latitude = $http->postVariable( $base . '_data_bcgmapslocation_latitude_' . $contentObjectAttribute->attribute( 'id' ) );
        $longitude = $http->postVariable( $base . '_data_bcgmapslocation_longitude_' . $contentObjectAttribute->attribute( 'id' ) );

        $location = new BCGMapsLocation( $latitude, $longitude );
        $contentObjectAttribute->setContent( $location );
        return true;
    }

    /*!
     Returns ...
    */
    function storeObjectAttribute( $contentObjectAttribute )
    {
        $location = $contentObjectAttribute->content();
        $contentObjectAttribute->setAttribute( "data_text", $location->xmlString() );
    }

    /*!
     Returns ...
    */
    function objectAttributeContent( $contentObjectAttribute )
    {
        $location = new BCGMapsLocation( '', '', '' );
        $location->decodeXML( $contentObjectAttribute->attribute( "data_text" ) );
        return $location;
    }

    /*!
     Returns ...
    */
    function metaData( $contentObjectAttribute )
    {
        return $contentObjectAttribute->attribute( "data_text" );
    }

    /*!
     Returns ...
    */
    function title( $contentObjectAttribute, $name = null )
    {
        $location = new BCGMapsLocation( '', '', '' );
        $location->decodeXML( $contentObjectAttribute->attribute( "data_text" ) );
        return $location->attribute('latitude') . ', ' . $location->attribute('longitude');
    }

    /*!
     A location when both coordinates are set (an empty attribute has "" or decodes to 0, 0).
    */
    function hasObjectAttributeContent( $contentObjectAttribute )
    {
        $location = $contentObjectAttribute->content();
        return $location instanceof BCGMapsLocation
            && (string)$location->attribute( 'latitude' ) !== '' && (string)$location->attribute( 'longitude' ) !== ''
            && !( (float)$location->attribute( 'latitude' ) == 0.0 && (float)$location->attribute( 'longitude' ) == 0.0 );
    }

    /*!
     Sets the default value.
    */
    function initializeObjectAttribute( $contentObjectAttribute, $currentVersion, $originalContentObjectAttribute )
    {
        if ( $currentVersion == false )
        {
            $location = $contentObjectAttribute->content();
            $contentClassAttribute = $contentObjectAttribute->contentClassAttribute();
            if ( !$location )
            {
                $location = new BCGMapsLocation( $contentClassAttribute->attribute( 'data_text1' ), '', '' );
            }
            else
            {
                $location->setLatitude('');
                $location->setLongitude('');
            }
            $contentObjectAttribute->setAttribute( "data_text", $location->xmlString() );
            $contentObjectAttribute->setContent( $location );
        }
    }

    /*!
     \reimp
    */
    function serializeContentObjectAttribute( $package, $objectAttribute )
    {
        $dom = new DOMDocument( '1.0', 'utf-8' );
        $success = $dom->loadXML( $objectAttribute->attribute( 'data_text' ) );
        $node = $this->createContentObjectAttributeDOMNode( $objectAttribute );

        if ( $success )
        {
            $importedNode = $node->ownerDocument->importNode( $dom->documentElement, true );
            $node->appendChild( $importedNode );
        }
        else
        {
            eZDebug::writeError( 'Error parsing XML from data_text', __METHOD__ );
        }

        return $node;
    }

    /*!
     \reimp
    */
    function unserializeContentObjectAttribute( $package, $objectAttribute, $attributeNode )
    {
        $locationNode = $attributeNode->getElementsByTagName( 'bcgmapslocation' )->item( 0 );

        // a package without a location has no node: nothing to set (reading it first failed on PHP 8)
        if ( $locationNode )
        {
            $objectAttribute->setAttribute( 'data_text', $locationNode->ownerDocument->saveXML( $locationNode ) );
        }
    }

    /*!
     The location as text, "latitude|longitude" (for imports, packages and scripts); "" when there is none.
    */
    function toString( $contentObjectAttribute )
    {
        if ( !$this->hasObjectAttributeContent( $contentObjectAttribute ) )
            return '';
        $location = $contentObjectAttribute->content();
        return $location->attribute( 'latitude' ) . '|' . $location->attribute( 'longitude' );
    }

    /*!
     Sets the location from "latitude|longitude"; an empty string clears it. Numbers only, in range.
    */
    function fromString( $contentObjectAttribute, $string )
    {
        $string = trim( (string)$string );
        if ( $string === '' )
        {
            $location = new BCGMapsLocation( '', '' );
        }
        else
        {
            $parts = array_map( 'trim', explode( '|', $string ) );
            if ( count( $parts ) < 2 || !is_numeric( $parts[0] ) || !is_numeric( $parts[1] ) ||
                 abs( (float)$parts[0] ) > 90 || abs( (float)$parts[1] ) > 180 )
                return false;
            $location = new BCGMapsLocation( (float)$parts[0], (float)$parts[1] );
        }
        $contentObjectAttribute->setContent( $location );
        $contentObjectAttribute->setAttribute( 'data_text', $location->xmlString() );
        return true;
    }

    /*!
     Not searchable text.
    */
    function isIndexable()
    {
        return false;
    }
}

eZDataType::register( BCGMapsLocationType::DATA_TYPE_STRING, "BCGMapsLocationType" );

?>